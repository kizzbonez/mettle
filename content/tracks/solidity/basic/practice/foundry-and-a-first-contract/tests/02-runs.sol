contract RunsTest is Test {
    Scoreboard board;

    function setUp() public {
        board = new Scoreboard();
    }

    function test_adds_runs_ball_after_ball() public {
        board.scoreRuns(1);
        board.scoreRuns(2);
        board.scoreRuns(3);
        assertEq(board.runs(), 6, "runs after balls of 1, 2 and 3");
        board.scoreRuns(4);
        assertEq(board.runs(), 10, "runs after a fourth ball of 4");
    }

    function testFuzz_adds_any_score(uint8 first, uint8 second) public {
        board.scoreRuns(first);
        board.scoreRuns(second);
        assertEq(board.runs(), uint256(first) + second, "runs after two scoring balls");
    }
}
