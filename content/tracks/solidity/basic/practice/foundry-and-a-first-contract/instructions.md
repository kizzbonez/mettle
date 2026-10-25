`solution.sol` holds the club's `Scoreboard` contract. It has three state variables, `runs`,
`wickets` and `balls`, all starting at 0, and `public`, so each has a getter (`board.runs()`).
`wicket()` and `overs()` are finished. One function is not.

1. Press **Run** once as the file is. The contract compiles, but the visible test fails with
   `` `scoreRuns` is not written yet ``: the starter's `revert("not implemented: scoreRuns")`
   stops every call to it.
2. At the comment `YOUR CODE`, write the body of
   **`function scoreRuns(uint256 scored) public`**. A call records one ball on which the batters
   scored `scored` runs:
   - add `scored` to `runs`;
   - add 1 to `balls`, whatever was scored. A ball with no runs (a **dot ball**,
     `scoreRuns(0)`) is still a ball.
   - leave `wickets` alone.

   Then delete the `revert` line. `wicket()` just below shows how a function changes two state
   variables, one statement each, each ending with `;`.
3. Press **Run** again. The visible test prints the scoreboard with `console.log` and compares
   each value with what it expected. If a check fails, its message names the value that is
   wrong, then shows what your contract had and what the test expected.
4. When the visible test passes, press **Submit**. The hidden tests add up runs over many balls,
   count dot balls and overs, and check that scoring runs never changes the wickets.

The first four balls of the match, as the visible test plays them:

```solidity
Scoreboard board = new Scoreboard();
board.scoreRuns(4);  // runs 4, balls 1
board.scoreRuns(0);  // a dot ball: runs 4, balls 2
board.wicket();      // wickets 1, balls 3
board.scoreRuns(6);  // runs 10, balls 4
board.overs();       // 0: an over is six balls
```

If **Run** shows a compiler error instead, read its code, file, line and column, as in lesson 02:
`Expected ';' but got '}'` means the statement before the `}` it points at lacks its semicolon.
