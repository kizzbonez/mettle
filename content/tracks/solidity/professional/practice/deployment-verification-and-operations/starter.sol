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

    // Task 1
    function multisigFor(uint256 chainId) public pure returns (address) {
        revert("not implemented: multisigFor");
    }

    // Task 2
    function predict(bytes32 salt) public view returns (address) {
        revert("not implemented: predict");
    }

    // Task 3
    function deploy(bytes32 salt) external returns (BuoyRegistry registry) {
        revert("not implemented: deploy");
    }
}
