import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract GardenSetUpTest is Test {
    event PlotAssigned(uint256 indexed plot, address indexed holder);

    DeployGarden script;
    address deployer = makeAddr("deployer");
    address council = makeAddr("council");

    function setUp() public {
        script = new DeployGarden();
    }

    function _holders(uint256 n) internal returns (address[] memory holders) {
        holders = new address[](n);
        for (uint256 i = 0; i < n; i++) {
            holders[i] = makeAddr(string.concat("holder", vm.toString(i)));
        }
    }

    function test_assigns_every_first_plot_in_order() public {
        address[] memory holders = _holders(4);
        address predicted = script.predictRegistry(deployer);
        for (uint256 i = 0; i < 4; i++) {
            vm.expectEmit(predicted);
            emit PlotAssigned(i + 1, holders[i]);
        }
        (PlotRegistry registry,) = script.deploy(deployer, council, holders);
        assertEq(registry.holderOf(4), holders[3], "the holder of plot 4");
        assertEq(registry.holderOf(5), address(0), "the holder of a plot nobody was given");
    }

    function test_works_with_no_first_plots() public {
        (PlotRegistry registry, WaterRota rota) = script.deploy(deployer, council, new address[](0));
        assertEq(registry.rota(), address(rota), "the rota recorded in the registry");
        assertEq(registry.pendingOwner(), council, "the registry's pending owner");
    }

    function test_the_deployer_is_the_one_who_set_it_up() public {
        (PlotRegistry registry,) = script.deploy(deployer, council, _holders(1));
        assertEq(registry.owner(), deployer, "the registry's owner before the council accepts");
        vm.prank(council);
        registry.acceptOwnership();
        vm.prank(deployer);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, deployer));
        registry.assign(9, deployer);
    }

    function test_a_second_deployment_with_the_same_salt_fails() public {
        script.deploy(deployer, council, new address[](0));
        vm.expectRevert();
        script.deploy(deployer, council, new address[](0));
    }

    function test_another_deployer_gets_its_own_registry() public {
        (PlotRegistry first,) = script.deploy(deployer, council, new address[](0));
        address other = makeAddr("other deployer");
        (PlotRegistry second,) = script.deploy(other, council, new address[](0));
        assertTrue(address(first) != address(second), "whether two deployers got two registries");
        assertEq(second.owner(), other, "the second registry's owner");
    }
}
