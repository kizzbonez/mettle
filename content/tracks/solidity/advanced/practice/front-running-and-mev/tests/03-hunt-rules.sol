contract HuntRulesTest is Test {
    bytes32 constant PHRASE = keccak256("moon on the millpond");
    bytes32 constant WRONG = keccak256("not the phrase");
    bytes32 constant SALT = bytes32(uint256(0xC0DE));

    TreasureHunt hunt;
    address ada = makeAddr("ada");
    address ben = makeAddr("ben");

    function setUp() public {
        hunt = new TreasureHunt(keccak256(abi.encode(PHRASE)));
        hunt.fund{value: 2 ether}();
        vm.roll(10);
    }

    function commitmentFor(bytes32 phrase, address who) internal pure returns (bytes32) {
        return keccak256(abi.encode(phrase, SALT, who));
    }

    function test_wrong_phrase_reverts() public {
        vm.prank(ada);
        hunt.commit(commitmentFor(WRONG, ada));
        vm.roll(block.number + 1);
        vm.prank(ada);
        vm.expectRevert(TreasureHunt.WrongPhrase.selector);
        hunt.reveal(WRONG, SALT);
        assertEq(address(hunt).balance, 2 ether, "the pot after a wrong reveal");
    }

    function test_cannot_win_twice() public {
        vm.prank(ada);
        hunt.commit(commitmentFor(PHRASE, ada));
        vm.roll(block.number + 1);
        vm.prank(ada);
        hunt.reveal(PHRASE, SALT);
        assertEq(ada.balance, 2 ether, "ada's prize");

        vm.prank(ben);
        hunt.commit(commitmentFor(PHRASE, ben));
        vm.roll(block.number + 2);
        vm.prank(ben);
        vm.expectRevert(TreasureHunt.AlreadyWon.selector);
        hunt.reveal(PHRASE, SALT);
        assertEq(ben.balance, 0, "ben's balance after trying to win an already-won hunt");
    }

    function test_reveal_without_a_commitment_reverts() public {
        vm.prank(ada);
        vm.expectRevert(TreasureHunt.NoCommitment.selector);
        hunt.reveal(PHRASE, SALT);
    }

    function test_the_first_committer_still_wins_after_many_blocks() public {
        vm.prank(ada);
        hunt.commit(commitmentFor(PHRASE, ada));
        vm.roll(block.number + 50);
        vm.prank(ada);
        hunt.reveal(PHRASE, SALT);
        assertEq(ada.balance, 2 ether, "ada's prize revealed long after her commit");
    }
}
