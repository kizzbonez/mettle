// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable, Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {Script} from "forge-std/Script.sol";

/// @notice Who holds which plot in the community garden. Finished: do not change it.
contract PlotRegistry is Ownable2Step {
    address public rota;
    mapping(uint256 plot => address) public holderOf;

    event PlotAssigned(uint256 indexed plot, address indexed holder);

    error RotaAlreadySet();

    constructor(address initialOwner) Ownable(initialOwner) {}

    function setRota(address rota_) external onlyOwner {
        if (rota != address(0)) revert RotaAlreadySet();
        rota = rota_;
    }

    function assign(uint256 plot, address holder) external onlyOwner {
        holderOf[plot] = holder;
        emit PlotAssigned(plot, holder);
    }
}

/// @notice The watering rota, which reads the registry. Finished: do not change it.
contract WaterRota {
    PlotRegistry public immutable registry;

    constructor(PlotRegistry registry_) {
        registry = registry_;
    }
}

/// @notice Deploys the garden's contracts: the registry at the same address on every chain,
/// then the rota, then the first plots, and finally hands the registry to the council.
contract DeployGarden is Script {
    bytes32 public constant SALT = keccak256("tannery-lane-garden-v1");

    error UnexpectedAddress(address predicted, address deployed);

    /// @notice Where `new PlotRegistry{salt: SALT}(deployer)` lands when a script broadcasts it:
    /// forge sends salted deployments through the CREATE2 factory, so the factory is the creator.
    function predictRegistry(address deployer) public pure returns (address) {
        bytes32 initCodeHash = keccak256(abi.encodePacked(type(PlotRegistry).creationCode, abi.encode(deployer)));
        bytes32 hash = keccak256(abi.encodePacked(bytes1(0xff), CREATE2_FACTORY, SALT, initCodeHash));
        return address(uint160(uint256(hash)));
    }

    /// @notice Deploys and sets up everything as `deployer`, then starts the handover to `council`.
    /// Plot i + 1 goes to firstHolders[i].
    function deploy(address deployer, address council, address[] memory firstHolders)
        public
        returns (PlotRegistry registry, WaterRota rota)
    {
        vm.startBroadcast(deployer);

        // The deployer owns the registry at first, so that it can set it up.
        registry = new PlotRegistry{salt: SALT}(deployer);
        address predicted = predictRegistry(deployer);
        if (address(registry) != predicted) revert UnexpectedAddress(predicted, address(registry));

        rota = new WaterRota(registry);
        registry.setRota(address(rota));
        for (uint256 i = 0; i < firstHolders.length; i++) {
            registry.assign(i + 1, firstHolders[i]);
        }

        // Ownable2Step: the council becomes the owner only when it accepts.
        registry.transferOwnership(council);

        vm.stopBroadcast();
    }

    /// @notice What `forge script` runs: the account given with --account (or --sender) deploys,
    /// and the council's address comes from the COUNCIL environment variable.
    function run() external returns (PlotRegistry, WaterRota) {
        return deploy(msg.sender, vm.envAddress("COUNCIL"), new address[](0));
    }
}
