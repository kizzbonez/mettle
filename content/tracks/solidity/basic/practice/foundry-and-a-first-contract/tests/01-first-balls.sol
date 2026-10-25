// The first four balls of the match, as in the instructions.
contract FirstBallsTest is Test {
    Scoreboard board;

    function setUp() public {
        board = new Scoreboard();
    }

    function test_first_four_balls() public {
        board.scoreRuns(4);
        board.scoreRuns(0);
        board.wicket();
        board.scoreRuns(6);
        console.log("runs:", board.runs());
        console.log("wickets:", board.wickets());
        console.log("balls:", board.balls());
        assertEq(board.runs(), 10, "runs after 4, 0, a wicket and 6");
        assertEq(board.wickets(), 1, "wickets after one wicket");
        assertEq(board.balls(), 4, "balls after four balls");
    }
}
