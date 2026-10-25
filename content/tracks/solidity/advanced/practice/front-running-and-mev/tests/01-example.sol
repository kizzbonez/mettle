contract TreasureHuntExampleTest is Test {
    event Won(address indexed winner, uint256 prize);

    bytes32 constant PHRASE = keccak256("lantern over the weir");
    bytes32 constant SALT = bytes32(uint256(0xA11CE));

    TreasureHunt hunt;
    address ada = makeAddr("ada");
    address searcher = makeAddr("searcher");

    function setUp() public {
        hunt = new TreasureHunt(keccak256(abi.encode(PHRASE)));
        hunt.fund{value: 5 ether}();
        vm.roll(100);
    }

    function commitmentFor(address who) internal pure returns (bytes32) {
        return keccak256(abi.encode(PHRASE, SALT, who));
    }

    function test_example() public {
        vm.prank(ada);
        hunt.commit(commitmentFor(ada));

        vm.roll(block.number + 1);
        vm.expectEmit(address(hunt));
        emit Won(ada, 5 ether);
        vm.prank(ada);
        hunt.reveal(PHRASE, SALT);

        assertEq(ada.balance, 5 ether, "ada's prize after revealing");
        assertEq(hunt.winner(), ada, "the recorded winner");
    }

    /// Attack test: a searcher sees ada's reveal in the mempool and tries to commit and reveal
    /// the same phrase in one block, ahead of her.
    function test_attack_front_run_the_reveal() public {
        vm.prank(ada);
        hunt.commit(commitmentFor(ada)); // ada committed at block 100
        vm.roll(block.number + 1); // block 101: ada's reveal is now pending in the mempool

        vm.prank(searcher);
        hunt.commit(commitmentFor(searcher));
        vm.prank(searcher);
        try hunt.reveal(PHRASE, SALT) {} catch {} // same block as the searcher's commit

        assertEq(searcher.balance, 0, "ether a front-running searcher took");
        assertEq(address(hunt).balance, 5 ether, "the pot after the front-run attempt");
    }
}
