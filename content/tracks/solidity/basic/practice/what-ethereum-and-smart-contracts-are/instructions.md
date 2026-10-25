This first lab is about the lab itself: how you run your code, how the tests report on it, and
how you hand it in. The contract in `solution.sol` is finished and the compiler accepts it, but
one number in it is out of date. You do not need to know any Solidity yet: the comments in the
file say what each part does.

1. Press **Run** without changing anything. The contract is compiled, then the first test
   deploys it on a local test chain (a private EVM inside the sandbox, with no real ether),
   calls its functions and checks what they return. The test fails. Its message has three
   parts: what was checked, the value your contract returned, and the value the test expected,
   as in `the number of seats on the new boat: 30 != 40`.
2. Find the line under the comment that says `CHANGE`. The new boat seats 40 passengers, so
   change the `30` on that line to `40`. Change nothing else: `book` and `seatsLeft` work out
   what is left from `SEATS` and `sold` by themselves.
3. Press **Run** again. The test now passes, and its output shows the two `console.log` lines
   the test printed: the places sold and the seats left after a booking of three.
4. Press **Submit**. Submit runs the visible test again and three hidden tests, which check the
   number of seats, that the contract sells up to the last seat and refuses one more, and that
   the rest of the contract is unchanged. For a hidden test you see only its name and what it
   checked, not the values.

What the finished contract does, in the order the visible test calls it:

```solidity
LanternCruise cruise = new LanternCruise(); // deploys the contract: sold is 0
cruise.SEATS();      // 40
cruise.seatsLeft();  // 40
cruise.book(3);      // sells 3 places
cruise.sold();       // 3
cruise.seatsLeft();  // 37
cruise.book(38);     // stops with NotEnoughSeats(38, 37) and sells nothing
```

The compiler could not find this mistake for you: `30` is a perfectly good number, just not the
right one. Catching mistakes like that is what tests are for, and on a real chain, where a
deployed contract cannot be edited, they have to catch it before it is deployed.
