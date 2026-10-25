Complete `OrchardTrees` in `solution.sol`. It inherits OpenZeppelin's `ERC721`, so `ownerOf`,
`balanceOf`, `tokenURI`, approvals and both kinds of transfer already exist. The constants, state,
errors and the three functions to write are declared for you.

1. **`function adopt() external returns (uint256 id)`** lets the caller adopt the next tree for
   free and mints its certificate to `msg.sender`:
   - revert with `AlreadyAdopted(msg.sender)` if this address has adopted before, even if it has
     since given the certificate away; check this first;
   - then revert with `AllAdopted()` if all `TREES` (5) trees are taken;
   - otherwise set `hasAdopted[msg.sender]`, raise `adopted` by one and mint tree number
     `adopted` (so the ids are 1, 2, 3, 4, 5) with **`_safeMint`**, and return the id.

   `_safeMint` calls `onERC721Received` on a contract caller, which may call `adopt` again: do
   all the bookkeeping **before** the mint. A contract that does not implement the hook cannot
   adopt (`ERC721InvalidReceiver`, from OpenZeppelin).
2. **`function _baseURI() internal pure override returns (string memory)`** returns
   `"https://orchard.example/trees/"`, so `tokenURI(3)` is `"https://orchard.example/trees/3"`.
3. **`_update(address to, uint256 id, address auth)`**: nobody may hold more than
   `MAX_PER_HOLDER` (2) certificates. When `to` is not the zero address and already holds
   `MAX_PER_HOLDER`, revert with `TooManyTrees(to)`; otherwise return `super._update(to, id, auth)`.
   Every mint and transfer passes through `_update`, so one check covers `adopt`,
   `transferFrom` and `safeTransferFrom`. Giving a certificate away is always allowed.

```solidity
OrchardTrees orchard = new OrchardTrees();
// ana calls orchard.adopt()           -> 1; tokenURI(1) is "https://orchard.example/trees/1"
// ben calls orchard.adopt()           -> 2
// ana calls orchard.adopt() again     -> reverts AlreadyAdopted(ana)
// ana: safeTransferFrom(ana, ben, 1)  -> ben now holds 2 certificates
// cara calls orchard.adopt()          -> 3
// cara: transferFrom(cara, ben, 3)    -> reverts TooManyTrees(ben)
```
