`solution.sol` holds `TeaVaultV1`, an ERC-4626 vault that runs behind an `ERC1967Proxy` and is
upgraded with UUPS, and `TeaVaultV2`, its next version. The starter gives you the ERC-7201
storage struct and its `_vault()` pointer, the constants, events and errors, the getters, the
share token (a complete ERC-20 with `_mint`, `_burn` and `_spendAllowance`), `asset`,
`totalAssets`, `convertToShares`, `convertToAssets`, the four `max` functions of V1, and V2's
namespace. Keep every name, signature and the struct's field order: the tests read the storage
directly. You write the parts marked with a task. `using Math for uint256` and `SafeERC20` are set
up, so `x.mulDiv(y, z, Math.Rounding.Ceil)` and `$.asset.safeTransfer(to, amount)` work.

The tests deploy it like this, with a 0.5% exit fee:

```solidity
TeaVaultV1 implementation = new TeaVaultV1();
bytes memory init = abi.encodeCall(TeaVaultV1.initialize, (IERC20(address(leaf)), owner, treasury, 50));
TeaVaultV1 vault = TeaVaultV1(address(new ERC1967Proxy(address(implementation), init)));
```

1. **Initialization.**
   - The constructor calls `_disableInitializers()`, so nobody can initialize the implementation
     itself.
   - `initialize(asset_, owner_, treasury_, exitFeeBps_)` (it has the `initializer` modifier)
     reverts with `ZeroAddress()` if any of the three addresses is zero and with
     `FeeTooHigh(exitFeeBps_, MAX_EXIT_FEE_BPS)` above 200 basis points. It stores the asset, the
     asset's decimals (`IERC20Metadata(address(asset_)).decimals()`), the owner, the treasury and
     the fee.
2. **Administration.**
   - `setExitFee(uint16 bps)`: only the owner, otherwise `NotOwner(msg.sender)`; above 200,
     `FeeTooHigh(bps, MAX_EXIT_FEE_BPS)`. It emits `ExitFeeChanged(previousBps, bps)` and
     stores the new fee.
   - `_authorizeUpgrade`: only the owner may upgrade, otherwise `NotOwner(msg.sender)`.
3. **Conversions with virtual shares.** The vault counts as if it always held
   `10 ** DECIMALS_OFFSET` (1,000) more shares and 1 more asset, which makes a donation to an
   empty vault useless to an attacker:
   - `_convertToShares(assets, rounding)` is
     `assets.mulDiv(totalSupply + 10 ** DECIMALS_OFFSET, totalAssets() + 1, rounding)`;
   - `_convertToAssets(shares, rounding)` is
     `shares.mulDiv(totalAssets() + 1, totalSupply + 10 ** DECIMALS_OFFSET, rounding)`.
4. **Previews**, rounding in the vault's favour, with `bps` the current exit fee. The fee is
   always rounded up.
   - `previewDeposit(assets)`: `_convertToShares(assets, Floor)`.
   - `previewMint(shares)`: `_convertToAssets(shares, Ceil)`.
   - `previewWithdraw(assets)`: the fee comes on top, `fee = assets.mulDiv(bps, 10_000, Ceil)`,
     and the shares are `_convertToShares(assets + fee, Ceil)`.
   - `previewRedeem(shares)`: the fee is inside the value of the shares,
     `gross = _convertToAssets(shares, Floor)` and `fee = gross.mulDiv(bps, bps + 10_000, Ceil)`,
     and it returns `gross - fee`.
5. **Actions.** Each one checks its limit first and computes exactly what its preview returns.
   - `deposit(assets, receiver)` reverts with `ERC4626ExceededMaxDeposit(receiver, assets, max)`
     when `assets > maxDeposit(receiver)`. It takes the assets from `msg.sender` with
     `safeTransferFrom`, then mints the shares to `receiver`, emits
     `Deposit(msg.sender, receiver, assets, shares)` and returns the shares.
   - `mint(shares, receiver)` does the same for an exact number of shares, with
     `ERC4626ExceededMaxMint(receiver, shares, max)`, and returns the assets it took.
   - `withdraw(assets, receiver, owner_)` reverts with
     `ERC4626ExceededMaxWithdraw(owner_, assets, max)` above `maxWithdraw(owner_)`;
     `redeem(shares, receiver, owner_)` with `ERC4626ExceededMaxRedeem(owner_, shares, max)`
     above `maxRedeem(owner_)`. When `msg.sender` is not `owner_`, they spend its share
     allowance first (`_spendAllowance(owner_, msg.sender, shares)`). They burn the shares
     **before** sending anything, send the fee (when it is above zero) to the treasury and the
     assets to `receiver`, and emit `Withdraw(msg.sender, receiver, owner_, assets, shares)`, where
     `assets` is what `receiver` got. `withdraw` returns the shares, `redeem` the assets.
6. **Version 2** keeps its state in its own namespace (written for you), never in V1's struct.
   - `initializeV2(uint256 cap)` (it has `reinitializer(2)`): only the owner, otherwise
     `NotOwner(msg.sender)`. It stores the cap and emits `DepositCapChanged(cap)`.
   - `version()` returns 2.
   - `maxDeposit` returns what can still be deposited before `totalAssets()` reaches the cap,
     and 0 when it already has; `maxMint(receiver)` is `previewDeposit(maxDeposit(receiver))`.

**Gas budgets.** Through the proxy, a first deposit by a new depositor must use under 110,000 gas
and a redeem that pays the fee under 125,000 (the reference solution uses about 95,000 and
107,000). Keep to the struct's fields: every new storage slot costs over 20,000 gas, and a lock is
cheapest in transient storage.

The example test: Alice and Bob each have 10,000 LEAF.

```solidity
vault.deposit(1_000e18, alice);         // as Alice: 1,000,000e18 shares (an empty vault gives 1,000 shares per wei)
vault.deposit(500e18, bob);             // as Bob: 500,000e18 shares
leaf.mint(address(vault), 150e18);      // the harvest bonus: every share is now worth 10% more
vault.redeem(aliceShares, alice, alice); // as Alice: worth 1,099.999999999999999999 LEAF (rounded down);
                                         // 1,094.527363184079601989 to her, 5.472636815920398010 to the treasury
vault.totalAssets();                    // 550.000000000000000001 LEAF: the rounding wei stays in the vault
vault.upgradeToAndCall(address(new TeaVaultV2()), abi.encodeCall(TeaVaultV2.initializeV2, (2_000e18))); // as owner
TeaVaultV2(address(vault)).maxDeposit(bob); // 2,000 LEAF - 550.000000000000000001
```
