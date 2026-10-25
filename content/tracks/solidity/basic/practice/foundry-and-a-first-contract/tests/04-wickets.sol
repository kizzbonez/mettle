contract WicketsTest is Test {
    function test_scoring_takes_no_wickets() public {
        Scoreboard board = new Scoreboard();
        board.scoreRuns(4);
        board.scoreRuns(1);
        assertEq(board.wickets(), 0, "wickets after two scoring balls");
        board.wicket();
        board.scoreRuns(2);
        assertEq(board.wickets(), 1, "wickets after one wicket and three scoring balls");
        assertEq(board.runs(), 7, "runs, which a wicket leaves alone");
        assertEq(board.balls(), 4, "balls after four balls");
    }
}
