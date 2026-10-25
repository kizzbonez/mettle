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

    // Task 1: the address where `new PlotRegistry{salt: SALT}(deployer)` lands when broadcast.
    function predictRegistry(address deployer) public pure returns (address) {
        revert("not implemented: predictRegistry");
    }

    // Task 2: deploy and set up everything as `deployer`, then start the handover to `council`.
    function deploy(address deployer, address council, address[] memory firstHolders)
        public
        returns (PlotRegistry registry, WaterRota rota)
    {
        revert("not implemented: deploy");
    }

    /// @notice What `forge script` runs: the account given with --account (or --sender) deploys,
    /// and the council's address comes from the COUNCIL environment variable.
    function run() external returns (PlotRegistry, WaterRota) {
        return deploy(msg.sender, vm.envAddress("COUNCIL"), new address[](0));
    }
}
