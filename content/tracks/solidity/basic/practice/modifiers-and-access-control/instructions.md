Complete `TelescopeRota` in `solution.sol`. The state, the events, the errors and the
`onlyDirector` modifier are written for you; follow `onlyDirector` as the pattern for your own.
The deployer is the first director.

1. **`modifier onlyObserver()`** reverts with `NotObserver(msg.sender)` unless
   `isObserver[msg.sender]` is true, then runs the function body. Check `msg.sender`, never
   `tx.origin`.
2. **`modifier whenNotPaused()`** reverts with `RotaPaused()` while `paused` is true.
3. **Guard `pause()` and `unpause()`** with `onlyDirector`. As written, anyone can close the rota.
4. **Guard `bookNight(uint256 night)`** with `onlyObserver whenNotPaused`, in that order, so that
   a non-observer is told `NotObserver` even while the rota is paused. Its body is written.
5. **`offerDirectorship(address next) external`**, for the director only: store `next` as
   `candidate` and emit `DirectorshipOffered(director, next)`. The director does not change yet,
   and a new offer replaces an earlier one.
6. **`acceptDirectorship() external`**: anyone but the `candidate` is refused with
   `NotCandidate(msg.sender)`. The candidate becomes the director: emit
   `DirectorChanged(previousDirector, newDirector)` with the old director first, then set
   `director` and clear `candidate` back to `address(0)`, so that the offer cannot be used again.

Example (`this` is the test contract, which deploys the rota):

```solidity
TelescopeRota rota = new TelescopeRota();
rota.setObserver(ada, true);
vm.prank(ada);
rota.bookNight(5);                 // emits NightBooked(5, ada)
rota.offerDirectorship(bea);       // emits DirectorshipOffered(this, bea); director is still this
vm.prank(bea);
rota.acceptDirectorship();         // emits DirectorChanged(this, bea); candidate is address(0)
rota.pause();                      // reverts with NotDirector(this): Bea is the director now
```
