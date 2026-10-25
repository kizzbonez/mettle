import {IERC721Errors} from "@openzeppelin/contracts/interfaces/draft-IERC6093.sol";

/// A contract that was never written to hold NFTs.
contract ToolShed {
    function adoptFrom(OrchardTrees orchard) external returns (uint256) {
        return orchard.adopt();
    }
}

contract AdoptionRulesTest is Test {
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);

    OrchardTrees orchard;

    function setUp() public {
        orchard = new OrchardTrees();
    }

    function adoptAs(address who) internal returns (uint256) {
        vm.prank(who);
        return orchard.adopt();
    }

    function test_ids_run_from_one_to_five() public {
        for (uint256 i = 1; i <= 5; i++) {
            address who = address(uint160(0x1000 + i));
            assertEq(adoptAs(who), i, "the id returned by each adoption in turn");
            assertEq(orchard.ownerOf(i), who, "the owner of each adopted tree");
            assertTrue(orchard.hasAdopted(who), "hasAdopted after adopting");
        }
        assertEq(orchard.adopted(), 5, "the adopted counter after five adoptions");
    }

    function test_refuses_a_sixth_adopter() public {
        for (uint256 i = 1; i <= 5; i++) {
            adoptAs(address(uint160(0x1000 + i)));
        }
        vm.prank(address(0x2000));
        vm.expectRevert(OrchardTrees.AllAdopted.selector);
        orchard.adopt();
    }

    function test_once_per_address_even_after_giving_it_away() public {
        address ana = address(0xA11CE);
        adoptAs(ana);
        vm.prank(ana);
        orchard.transferFrom(ana, address(0xB0B), 1);
        assertEq(orchard.balanceOf(ana), 0, "ana's certificates after giving hers away");

        vm.prank(ana);
        vm.expectRevert(abi.encodeWithSelector(OrchardTrees.AlreadyAdopted.selector, ana));
        orchard.adopt();
    }

    function test_adoption_emits_a_mint_transfer() public {
        vm.expectEmit(address(orchard));
        emit Transfer(address(0), address(0xA11CE), 1);
        adoptAs(address(0xA11CE));
    }

    function test_a_contract_without_the_hook_cannot_adopt() public {
        ToolShed shed = new ToolShed();
        vm.expectRevert(abi.encodeWithSelector(IERC721Errors.ERC721InvalidReceiver.selector, address(shed)));
        shed.adoptFrom(orchard);
        assertEq(orchard.adopted(), 0, "the adopted counter after a refused adoption");
        assertFalse(orchard.hasAdopted(address(shed)), "hasAdopted after a refused adoption");
    }

    function testFuzz_a_new_adopter_gets_the_next_id(address who) public {
        assumeNotForgeAddress(who);
        vm.assume(who != address(0) && who.code.length == 0);
        adoptAs(address(0xA11CE));
        assertEq(adoptAs(who == address(0xA11CE) ? address(0xB0B) : who), 2, "the id of the second adoption");
        assertEq(orchard.adopted(), 2, "the adopted counter after two adoptions");
    }
}
