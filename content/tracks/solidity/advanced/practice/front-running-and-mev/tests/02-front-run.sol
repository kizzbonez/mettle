contract FrontRunTest is Test {
    bytes32 constant PHRASE = keccak256("the ninth lantern");
    bytes32 constant SALT = bytes32(uint256(0xBEEF));

    TreasureHunt hunt;
    address ada = makeAddr("ada");
    address searcher = makeAddr("searcher");

    function setUp() public {
        hunt = new TreasureHunt(keccak256(abi.encode(PHRASE)));
        hunt.fund{value: 3 ether}();
        vm.roll(500);
    }

    function commitmentFor(address who) internal pure returns (bytes32) {
        return keccak256(abi.encode(PHRASE, SALT, who));
    }

    function test_attack_commit_and_reveal_in_one_block() public {
        // ada committed earlier and is about to reveal.
        vm.prank(ada);
        hunt.commit(commitmentFor(ada));
        vm.roll(block.number + 1);

        // the searcher, having seen the phrase, commits and reveals in this same block.
        vm.prank(searcher);
        hunt.commit(commitmentFor(searcher));
        vm.prank(searcher);
        try hunt.reveal(PHRASE, SALT) {} catch {}
        assertEq(searcher.balance, 0, "ether a same-block front-runner won");

        // ada reveals in the next block and wins as intended.
        vm.roll(block.number + 1);
        vm.prank(ada);
        hunt.reveal(PHRASE, SALT);
        assertEq(ada.balance, 3 ether, "ada's prize after the honest reveal");
    }

    function test_reveal_in_the_commit_block_is_refused() public {
        vm.prank(searcher);
        hunt.commit(commitmentFor(searcher));
        vm.prank(searcher);
        vm.expectRevert(
            abi.encodeWithSelector(TreasureHunt.RevealTooEarly.selector, block.number, block.number + 1)
        );
        hunt.reveal(PHRASE, SALT);
    }

    function test_attack_reveal_someone_elses_commitment() public {
        // ada commits; the searcher learns the phrase and salt but never committed them himself.
        vm.prank(ada);
        hunt.commit(commitmentFor(ada));
        vm.roll(block.number + 5);

        vm.prank(searcher);
        vm.expectRevert(TreasureHunt.NoCommitment.selector);
        hunt.reveal(PHRASE, SALT);
        assertEq(searcher.balance, 0, "ether a searcher took with another hunter's commitment");
    }
}
