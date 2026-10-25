contract BallsAndOversTest is Test {
    Scoreboard board;

    function setUp() public {
        board = new Scoreboard();
    }

    function test_a_dot_ball_is_still_a_ball() public {
        board.scoreRuns(0);
        assertEq(board.balls(), 1, "balls after one dot ball");
        assertEq(board.runs(), 0, "runs after one dot ball");
    }

    function test_two_overs() public {
        for (uint256 i = 0; i < 11; i++) {
            board.scoreRuns(1);
        }
        board.wicket();
        assertEq(board.balls(), 12, "balls after eleven scoring balls and a wicket");
        assertEq(board.overs(), 2, "complete overs after twelve balls");
        board.scoreRuns(2);
        assertEq(board.overs(), 2, "complete overs after thirteen balls");
    }
}
