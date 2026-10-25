`solution.sol` holds `ObservatoryFund`. The `onlyWarden` and `onlyKeeper` modifiers are written
for you, and some functions use them. Three do not, and a stranger can use each gap. Fix the
three without changing anything else: keep every name, error, event and modifier.

**Tasks**

1. **`initialise(address warden_)`** is an unprotected initializer: anyone can call it again and
   become the warden. Make it set the warden only once. A second call must revert with
   `AlreadyInitialised()`; the zero-address check and the `Initialised` event stay. (A `bool`
   state variable is declared for you.)
2. **`addKeeper(address keeper)`** has no access control, so anyone can appoint keepers,
   including themselves. Restrict it to the warden; a stranger must get
   `NotWarden(caller)`. `removeKeeper` already shows the pattern.
3. **`spend(address to, uint256 amount)`** authorises with `tx.origin`, so a contract the warden
   is tricked into calling can spend the fund in the warden's name (a phishing attack). Authorise
   with `msg.sender` instead, so only a transaction the warden sends directly can spend. A
   stranger, or a tricked warden's helper contract, must get `NotWarden(caller)`. The
   `InsufficientFunds` check, the `Spent` event and the payment stay.

Everything else keeps its behaviour: `donate()` takes ether from anyone, `logNight()` is for
keepers (`NotKeeper(caller)` otherwise), and the public getters `warden`, `isKeeper`, `nights`.

**Example**

```solidity
fund.initialise(warden);           // sets the warden once; a second call reverts AlreadyInitialised()
fund.donate{value: 4 ether}();     // anyone
fund.addKeeper(keeper);            // as the warden; a stranger reverts NotWarden(stranger)
fund.logNight();                   // as the keeper: nights() becomes 1
fund.spend(warden, 1 ether);       // as the warden, sent directly: pays 1 ether, emits Spent(warden, 1 ether)
```

The hidden tests act as attackers: they re-initialise the fund, call `addKeeper` from a stranger,
and route `spend` through a helper contract while `tx.origin` is the warden (set in a test with
`vm.prank(warden, warden)`). Each uses `try ... {} catch {}` and then checks that the warden, the
keepers and the fund's ether are unchanged.
