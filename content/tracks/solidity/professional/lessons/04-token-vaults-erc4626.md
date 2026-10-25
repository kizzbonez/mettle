---
title: Token Vaults with ERC-4626
summary: Build tokenized vaults on the ERC-4626 standard. Convert between assets and shares, round every conversion in the vault's favour, use OpenZeppelin 5.7's ERC4626, see the donation attack rob a naive vault and fail against virtual shares, add fees that the previews report honestly, and test a vault with fuzz and invariant tests.
minutes: 45
objectives:
  - Use the ERC-4626 functions (deposit, mint, withdraw, redeem, previews, max and convert) and explain assets versus shares
  - Apply the standard's rounding directions and check them against OpenZeppelin's results
  - Explain the inflation (donation) attack and defend against it with virtual shares and _decimalsOffset
  - Add a fee through the preview functions and the _deposit or _withdraw hook, and test the vault with fuzzing and an invariant
---

## Outline

1. Assets and shares
2. The ERC-4626 interface
3. Share math and rounding
4. The donation attack
5. Virtual shares and the decimals offset
6. Fees
7. Testing a vault

## Assets and shares

A **vault** holds one ERC-20 token, its **asset**, on behalf of many depositors and issues its own
ERC-20 token, **shares**, in return. A share is a claim on a fraction of everything the vault
holds. When the vault earns (lending fees, rewards, a strategy's profit), its assets grow while
the number of shares stays the same, so every share is worth more. Nobody's balance has to be
updated: the price per share does the work.

**ERC-4626**, the Tokenized Vault Standard, fixes the interface, so wallets, aggregators and other
contracts can use any vault the same way.

## The ERC-4626 interface

| Function | Gives | Takes |
| --- | --- | --- |
| `deposit(assets, receiver)` | shares (minted to `receiver`) | exactly `assets` |
| `mint(shares, receiver)` | exactly `shares` | the assets needed |
| `withdraw(assets, receiver, owner)` | exactly `assets` | the shares needed, from `owner` |
| `redeem(shares, receiver, owner)` | the assets they are worth | exactly `shares` |

Each has a `preview...` function that returns what the call would do now, fees included, and a
`max...` function that returns the largest amount that would succeed (`maxDeposit` returns 0 when
deposits are closed). `convertToShares` and `convertToAssets` give the plain exchange rate, without
fees. `totalAssets()` is what the vault manages, and the events are `Deposit` and `Withdraw`.

## Share math and rounding

Shares are minted in proportion: `shares = assets * totalSupply / totalAssets`. Integer division
truncates, so every conversion must lose its remainder somewhere, and the standard says where:
**in the vault's favour**. Paying out (shares for `deposit`, assets for `redeem`) rounds down;
charging the user (assets for `mint`, shares for `withdraw`) rounds up. Otherwise a user could
repeat a tiny action and collect a rounding wei each time from the other depositors.

OpenZeppelin's `ERC4626` implements all of this, and is all most vaults need:

```solidity
contract GrainVault is ERC4626 {
    constructor(IERC20 grain) ERC20("Grain Vault", "vGRN") ERC4626(grain) {}
}
```

Its previews when it holds 1,500 grain against 1,000 shares, so 1.5 grain per share:

```text
convertToShares(100): 66
previewDeposit(100):  66
previewMint(100):     150
previewWithdraw(100): 67
previewRedeem(100):   149
```

100 grain buys 66.69 shares, so `deposit` gives 66; 100 shares cost 149.95 grain, so `mint`
charges 150. `ERC4626` handles the math with `Math.mulDiv`, moves the asset with `SafeERC20`,
checks the `max` limits and emits the events. You change behaviour by overriding the `preview`
and `max` functions and the internal `_deposit` and `_withdraw` hooks, never by rewriting
`deposit` itself.

## The donation attack

The textbook formula has a weakness when the vault is empty. Anyone can send the asset straight to
the vault with an ERC-20 `transfer`, a **donation**: `totalAssets` grows but no shares are minted.
The **inflation attack** uses that:

1. The attacker is first: deposits 1 wei and gets 1 share.
2. The attacker donates 10,000 grain. The single share is now worth 10,000 grain.
3. The victim deposits 10,000 grain: `10,000e18 * 1 / (10,000e18 + 1)` rounds down to 0 shares.
4. The attacker redeems the one share for everything.

A hand-written vault with that formula, in a Foundry test:

```solidity
vm.startPrank(ATTACKER);
grain.approve(address(vault), type(uint256).max);
vault.deposit(1); // 1 share for 1 wei
grain.transfer(address(vault), DONATION); // a donation: no shares minted
vm.stopPrank();
```

```text
victim shares: 0
attacker gets back: 20000000000000000000001
```

The attacker can also front-run the victim's deposit (Advanced 05), so this needs no luck.

## Virtual shares and the decimals offset

OpenZeppelin's `ERC4626` computes with **virtual shares and assets**, as if the vault always held
one more asset and `10 ** _decimalsOffset()` more shares than it does:

```text
shares = assets * (totalSupply + 10**offset) / (totalAssets + 1)
```

The virtual shares own part of every donation, so the attacker can no longer capture all of it.
The same attack against the default offset of 0, then against `_decimalsOffset()` returning 6:

```text
victim shares: 1
attacker gets back: 6666666666666666666667
victim gets back:   6666666666666666666667

victim shares: 1999999
attacker gets back: 5000001250000312500078
victim gets back:   9999997499999374999845
```

With offset 0 the attack is no longer profitable (the attacker paid 10,000 and got 6,667 back),
but the victim still loses a third. With offset 6, the victim gets back 99.99997% and the attacker
loses half the donation, about two million times what the victim loses. The offset also
adds to `decimals()`: an 18-decimal asset gets 24-decimal shares. A second defence is to make the
first deposit yourself at deployment, so the vault is never empty.

## Fees

The standard requires previews to include fees, so a fee changes the previews and the hook that
moves the asset. An entry fee of 1%, after OpenZeppelin's `ERC4626Fees` example
(`mocks/docs/ERC4626Fees.sol`):

```solidity
function previewDeposit(uint256 assets) public view override returns (uint256) {
    uint256 fee = assets.mulDiv(FEE_BPS, FEE_BPS + 10_000, Math.Rounding.Ceil); // fee inside assets
    return super.previewDeposit(assets - fee);
}

function previewMint(uint256 shares) public view override returns (uint256) {
    uint256 assets = super.previewMint(shares);
    return assets + assets.mulDiv(FEE_BPS, 10_000, Math.Rounding.Ceil); // fee on top
}

function _deposit(address caller, address receiver, uint256 assets, uint256 shares) internal override {
    uint256 fee = assets.mulDiv(FEE_BPS, FEE_BPS + 10_000, Math.Rounding.Ceil);
    super._deposit(caller, receiver, assets, shares); // takes all the assets, mints the shares
    if (fee > 0) SafeERC20.safeTransfer(IERC20(asset()), treasury, fee);
}
```

```text
previewDeposit(1000): 990
shares: 990 treasury: 10
vault holds: 990
```

A deposit of 1,000 contains a fee of `1000 * 100 / 10100 = 9.9`, rounded **up** to 10. `deposit`
calls `previewDeposit`, so the shares minted match the preview exactly. An exit fee works the same
way through `previewWithdraw`, `previewRedeem` and `_withdraw`; this lesson's lab builds one.

## Testing a vault

A vault's promises are properties, so test them as properties. A round trip must never profit:

```solidity
function testFuzz_round_trip_never_profits(uint96 assets) public {
    // ... a vault that already holds deposits and some yield ...
    uint256 shares = vault.deposit(assets, user);
    uint256 back = vault.redeem(shares, user, user);
    assertLe(back, assets, "assets back after deposit then redeem");
}
```

And an **invariant** (Advanced 10) over random deposits, redemptions and yield from three actors: the
vault can always pay every holder what `previewRedeem` promises them.

```solidity
function invariant_holders_can_always_be_paid() public view {
    uint256 owed;
    for (uint256 i = 0; i < 3; i++) {
        owed += vault.previewRedeem(vault.balanceOf(handler.actors(i)));
    }
    assertLe(owed, vault.totalAssets(), "what every holder could redeem, against the vault's assets");
}
```

```text
[PASS] testFuzz_round_trip_never_profits(uint96) (runs: 256, μ: 2316375, ~: 2319392)
[PASS] invariant_holders_can_always_be_paid() (runs: 64, calls: 2048, reverts: 0)
```

Also check that every `preview` equals what the call then does, and that `max` amounts succeed.

## Common mistakes

- **Rounding the wrong way.** A fee computed as `assets * bps / 10_000` rounds down to 0 for
  small amounts, so users split withdrawals and pay nothing.
- **Previews that ignore the fee.** If `_withdraw` charges a fee that `previewRedeem` leaves out,
  the vault pays more than the shares are worth, and the last holder cannot leave. In this
  lesson's lab that attempt's final `redeem` reverts with
  `ERC20InsufficientBalance(0x2e234DAe75C793f67A35089C9d99245E1C58470b, 0, 4497500000000000000 [4.497e18])`.
- **Trusting `totalAssets` as a price.** Donations and losses move it within one transaction;
  previews are not safe oracles (Advanced 06).
- **A `maxDeposit` that underflows.** `cap - totalAssets()` reverts with
  `panic: arithmetic underflow or overflow (0x11)` once a donation pushes the vault past its cap.

## Practice

1. A vault holds 1,500 assets for 1,000 shares. What do `previewMint(100)` and
   `previewWithdraw(100)` return, and why do they differ from `previewDeposit(100)`?
2. Give `GrainVault` a decimals offset of 6. What does `decimals()` return for an 18-decimal asset?
3. Write the inflation attack as a test against your vault and print what the victim gets back.

### Answers

```solidity
contract GrainVaultOffset6 is ERC4626 {
    constructor(IERC20 grain) ERC20("Grain Vault", "vGRN") ERC4626(grain) {}

    function _decimalsOffset() internal pure override returns (uint8) {
        return 6;
    }
}
```

1. 150 and 67: both charge the user, so they round up; deposit pays out and rounds down to 66.
2. 24: the asset's 18 plus 6.
3. The test above against `GrainVaultOffset6` printed:

```text
victim shares: 1999999
victim gets back:   9999997499999374999845
```

## Key takeaways

- A vault turns assets into shares; earnings raise the price of a share, not the number.
- Round in the vault's favour: down when paying out, up when charging.
- Empty vaults invite donation attacks; virtual shares and a `_decimalsOffset` make them unprofitable.
- Fees go into the previews and the hooks, so previews always match what calls do.
- Test vaults with fuzzed round trips and invariants.

## Further reading

- [ERC-4626: Tokenized Vaults](https://eips.ethereum.org/EIPS/eip-4626)
- [OpenZeppelin Contracts 5.x: ERC-4626](https://docs.openzeppelin.com/contracts/5.x/erc4626)
- [OpenZeppelin Contracts 5.x: ERC20 extensions API (ERC4626)](https://docs.openzeppelin.com/contracts/5.x/api/token/erc20#ERC4626)
