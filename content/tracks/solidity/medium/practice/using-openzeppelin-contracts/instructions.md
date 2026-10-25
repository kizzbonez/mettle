Complete `DuesBox` in `solution.sol` with OpenZeppelin 5.7. The contract already inherits
`AccessControl`, `Pausable` and `ReentrancyGuardTransient`, and declares the two roles, the
state, the events and `ZeroYears()`. Use the library's modifiers and functions; write no access,
pause or reentrancy checks of your own, so that callers get OpenZeppelin's own errors.

1. **SafeERC20.** Attach the library to the token type: `using SafeERC20 for IERC20;`.
2. **Constructor roles.** Grant `DEFAULT_ADMIN_ROLE` to `admin` and `TREASURER_ROLE` to
   `treasurer` with `_grantRole`, and make `TREASURER_ROLE` the admin role of `STEWARD_ROLE`
   with `_setRoleAdmin`, so that the treasurer, not the admin, appoints stewards. The deployer
   gets no role.
3. **`payDues(uint256 numYears)`**: only while not paused (`whenNotPaused`) and not reentrant
   (`nonReentrant`). Revert with `ZeroYears()` when `numYears` is 0. The amount is
   `numYears * yearlyDues`. Add `numYears` to `yearsPaid[msg.sender]`, emit
   `DuesPaid(msg.sender, numYears, amount)`, and then pull the amount from the member with
   `token.safeTransferFrom(msg.sender, address(this), amount)`.
4. **`withdraw(address to, uint256 amount)`**: only `TREASURER_ROLE` (`onlyRole`), not
   reentrant, and **also while paused**, so that the treasurer can move funds to safety during an
   incident. Emit `Withdrawn(to, amount)`, then `token.safeTransfer(to, amount)`.
5. **`pause()` and `unpause()`**: only `STEWARD_ROLE`; they call `_pause()` and `_unpause()`.

What the tests expect from the library:

| Situation | Revert |
| --- | --- |
| a caller without the role | `AccessControlUnauthorizedAccount(caller, role)` |
| `payDues` while paused | `EnforcedPause()` |
| `unpause` while not paused | `ExpectedPause()` |
| a token whose `transfer` or `transferFrom` returns `false` | `SafeERC20FailedOperation(token)` |
| a token that calls `payDues` again while it is being paid | `ReentrancyGuardReentrantCall()` |

A token whose transfer functions return nothing at all (as some old tokens do) must work.

```solidity
DuesBox box = new DuesBox(coin, 30e18, admin, tess);
// tess grants STEWARD_ROLE to sam; an admin attempt reverts with
// AccessControlUnauthorizedAccount(admin, TREASURER_ROLE)
// mia approves 60e18 and calls payDues(2): yearsPaid(mia) == 2, DuesPaid(mia, 2, 60e18)
// sam calls pause(): mia's payDues(1) reverts with EnforcedPause()
// tess can still withdraw(clubAccount, 60e18) while the box is paused
```
