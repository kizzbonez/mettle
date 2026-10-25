import {IERC721Errors} from "@openzeppelin/contracts/interfaces/draft-IERC6093.sol";

contract MetadataAndLimitTest is Test {
    OrchardTrees orchard;
    address ana = address(0xA11CE);
    address ben = address(0xB0B);
    address cara = address(0xCA7A);
    address dev = address(0xDE5);

    function setUp() public {
        orchard = new OrchardTrees();
        vm.prank(ana);
        orchard.adopt(); // tree 1
        vm.prank(cara);
        orchard.adopt(); // tree 2
        vm.prank(dev);
        orchard.adopt(); // tree 3
    }

    // Compared as hashes, so that a failure does not print the expected text.
    function test_token_uris() public view {
        bytes32 uri2 = keccak256(bytes(orchard.tokenURI(2)));
        bytes32 uri3 = keccak256(bytes(orchard.tokenURI(3)));
        assertEq(uri2, keccak256("https://orchard.example/trees/2"), "the tokenURI of tree 2");
        assertEq(uri3, keccak256("https://orchard.example/trees/3"), "the tokenURI of tree 3");
        assertEq(orchard.name(), "Orchard Trees", "the collection's name");
    }

    function test_no_uri_for_a_tree_nobody_adopted() public {
        vm.expectRevert(abi.encodeWithSelector(IERC721Errors.ERC721NonexistentToken.selector, 5));
        orchard.tokenURI(5);
    }

    function test_limit_on_transfer_from() public {
        vm.prank(ana);
        orchard.transferFrom(ana, ben, 1);
        vm.prank(cara);
        orchard.transferFrom(cara, ben, 2);
        assertEq(orchard.balanceOf(ben), 2, "ben's certificates after two gifts");

        vm.prank(dev);
        vm.expectRevert(abi.encodeWithSelector(OrchardTrees.TooManyTrees.selector, ben));
        orchard.transferFrom(dev, ben, 3);
        assertEq(orchard.ownerOf(3), dev, "the owner of tree 3 after a refused gift");
    }

    function test_limit_on_safe_transfer_from() public {
        vm.prank(ana);
        orchard.safeTransferFrom(ana, ben, 1);
        vm.prank(cara);
        orchard.safeTransferFrom(cara, ben, 2);
        vm.prank(dev);
        vm.expectRevert(abi.encodeWithSelector(OrchardTrees.TooManyTrees.selector, ben));
        orchard.safeTransferFrom(dev, ben, 3);
    }

    function test_limit_on_adoption() public {
        vm.prank(ana);
        orchard.transferFrom(ana, ben, 1);
        vm.prank(cara);
        orchard.transferFrom(cara, ben, 2);
        vm.prank(ben);
        vm.expectRevert(abi.encodeWithSelector(OrchardTrees.TooManyTrees.selector, ben));
        orchard.adopt();
    }

    function test_a_full_holder_can_still_give_one_away() public {
        vm.prank(ana);
        orchard.transferFrom(ana, ben, 1);
        vm.prank(cara);
        orchard.transferFrom(cara, ben, 2);
        vm.prank(ben);
        orchard.transferFrom(ben, ana, 1);
        assertEq(orchard.ownerOf(1), ana, "the owner of tree 1 after ben gives it back");
        assertEq(orchard.balanceOf(ben), 1, "ben's certificates after giving one back");
    }

    function test_an_operator_moves_within_the_limit() public {
        vm.prank(dev);
        orchard.setApprovalForAll(ben, true);
        vm.prank(ben);
        orchard.transferFrom(dev, ana, 3);
        assertEq(orchard.balanceOf(ana), 2, "ana's certificates after an operator's transfer");
        vm.prank(cara);
        vm.expectRevert(abi.encodeWithSelector(OrchardTrees.TooManyTrees.selector, ana));
        orchard.transferFrom(cara, ana, 2);
    }
}
