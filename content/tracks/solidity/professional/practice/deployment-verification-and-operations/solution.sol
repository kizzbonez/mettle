// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice The buoy network's registry. It has no constructor arguments, so its init code, and
/// with it its CREATE2 address, is the same on every network. Its owner is set right after
/// deployment by the contract that deployed it, and by nobody else.
contract BuoyRegistry {
    address public immutable deployer;
    address public owner;

    error NotDeployer(address caller);
    error AlreadyInitialized();

    constructor() {
        deployer = msg.sender;
    }

    function initialize(address owner_) external {
        if (msg.sender != deployer) revert NotDeployer(msg.sender);
        if (owner != address(0)) revert AlreadyInitialized();
        owner = owner_;
    }
}

/// @notice Deploys a BuoyRegistry at the same address on every supported network, owned by that
/// network's multisig.
contract BuoyDeployer {
    error UnsupportedChain(uint256 chainId);
    error AlreadyDeployed(address registry);
    error DeploymentMismatch(address expected, address actual);

    event RegistryDeployed(uint256 indexed chainId, address registry, address owner);

    /// @notice The multisig that owns the registry on `chainId`.
    function multisigFor(uint256 chainId) public pure returns (address) {
        if (chainId == 1) return 0x1111111111111111111111111111111111111111; // Ethereum mainnet
        if (chainId == 10) return 0x2222222222222222222222222222222222222222; // OP Mainnet
        if (chainId == 42161) return 0x3333333333333333333333333333333333333333; // Arbitrum One
        revert UnsupportedChain(chainId);
    }

    /// @notice The address `deploy(salt)` creates: CREATE2 from this contract.
    function predict(bytes32 salt) public view returns (address) {
        bytes32 initCodeHash = keccak256(type(BuoyRegistry).creationCode);
        bytes32 digest = keccak256(abi.encodePacked(bytes1(0xff), address(this), salt, initCodeHash));
        return address(uint160(uint256(digest)));
    }

    /// @notice Deploys and initialises the registry in one transaction, so nobody can set its
    /// owner in between, then checks the result.
    function deploy(bytes32 salt) external returns (BuoyRegistry registry) {
        address multisig = multisigFor(block.chainid);
        address expected = predict(salt);
        // A second CREATE2 with the same salt would fail without saying why.
        if (expected.code.length > 0) revert AlreadyDeployed(expected);

        registry = new BuoyRegistry{salt: salt}();
        registry.initialize(multisig);

        if (address(registry) != expected) revert DeploymentMismatch(expected, address(registry));
        emit RegistryDeployed(block.chainid, address(registry), multisig);
    }
}
