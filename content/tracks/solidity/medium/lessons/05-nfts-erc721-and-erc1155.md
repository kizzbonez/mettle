---
title: "NFTs: ERC-721 and ERC-1155"
summary: Build non-fungible tokens with OpenZeppelin's ERC721, tell owners, approved addresses and operators apart, mint and transfer safely through the onERC721Received hook without opening a reentrancy hole, serve metadata with tokenURI, change the rules in _update, and meet ERC-1155 multi-tokens and ERC-165 interface detection.
minutes: 35
objectives:
  - Mint, approve and transfer ERC-721 tokens with OpenZeppelin's ERC721, and say who may move a token
  - Explain what safeTransferFrom and _safeMint check, implement onERC721Received, and finish state changes before the hook runs
  - Serve metadata through tokenURI and _baseURI, and add a transfer rule by overriding _update
  - Compare ERC-1155 with ERC-721 and detect a contract's interfaces with ERC-165 supportsInterface
---

## Outline

1. One token, one owner
2. Owners, approved addresses and operators
3. Safe transfers and the receiver hook
4. The hook runs someone else's code
5. Metadata and tokenURI
6. Changing the rules in _update
7. ERC-1155 and ERC-165

## One token, one owner

Any 10 units of an ERC-20 are as good as any other 10. A **non-fungible token (NFT)** is the
opposite: each token has its own **token id**, a `uint256`, and exactly one owner. **ERC-721**
standardises such tokens: tickets, certificates, deeds, game items, art. The contract keeps a
mapping from id to owner and a count per owner; the token *is* that entry.

The interface is `balanceOf(owner)`, `ownerOf(id)`, `transferFrom`, two `safeTransferFrom`
overloads, `approve`, `getApproved`, `setApprovalForAll` and `isApprovedForAll`, with the events
`Transfer(from, to, id)` (from the zero address for a mint, to it for a burn), `Approval` and
`ApprovalForAll`. As with ERC-20 in lesson 04, production code inherits OpenZeppelin's audited
`ERC721` rather than writing it again:

```solidity
contract GalleryPrints is ERC721 {
    address public immutable curator;
    uint256 private nextId = 1;

    error NotCurator(address caller);

    constructor() ERC721("Gallery Prints", "GPR") {
        curator = msg.sender;
    }

    /// @notice Mints the next print to `to` and returns its id.
    function mint(address to) external returns (uint256 id) {
        if (msg.sender != curator) revert NotCurator(msg.sender);
        id = nextId++;
        _safeMint(to, id);
    }

    function _baseURI() internal pure override returns (string memory) {
        return "https://prints.example/meta/";
    }
}
```

A test mints to `ana`, lets her approve `ben`, and has `ben` move the print (forge-std's
`makeAddr("ana")` turns a name into an address):

```text
[PASS] test_mint_approve_transfer() (gas: 2141295)
Logs:
  owner is ana: true
  ana's balance: 1
  tokenURI: https://prints.example/meta/1
  owner is ben: true
  approval after transfer: 0x0000000000000000000000000000000000000000
```

## Owners, approved addresses and operators

Three kinds of address may move a token. The **owner**. The **approved address** of that one
token, set with `approve(spender, id)`: there is one at a time and no amount, since an NFT is
there or not. And an **operator**, set with `setApprovalForAll(operator, true)`, who may move
*every* token the owner has in this contract, now and later. Marketplaces ask for operator
rights; so do phishing sites, because one click hands over a whole collection. Every transfer
clears the token's approved address, as the last log line shows. Anyone else gets
`ERC721InsufficientApproval(spender, id)`.

## Safe transfers and the receiver hook

`transferFrom` moves a token without asking the receiver. If `to` is a contract that was never
written to handle NFTs, nothing can ever call `transferFrom` for it again: the token is stuck
forever. `safeTransferFrom` and `_safeMint` therefore check: when `to` has code, they call its
`onERC721Received(operator, from, id, data)` and revert unless it returns the **magic value**
`IERC721Receiver.onERC721Received.selector` (`0x150b7a02`). Accounts without code are not called.
With the `GalleryPrints` above:

```solidity
contract Piggybank {} // knows nothing about NFTs

contract Vault is IERC721Receiver {
    uint256 public held;

    function onERC721Received(address operator, address from, uint256 id, bytes calldata) external returns (bytes4) {
        held++;
        console.log("print", id, "from", from);
        console.log("operator", operator);
        return IERC721Receiver.onERC721Received.selector;
    }
}

contract ReceiverTest is Test {
    GalleryPrints prints = new GalleryPrints();

    function test_mint_to_plain_contract() public {
        prints.mint(address(new Piggybank()));
    }

    function test_mint_to_receiver() public {
        prints.mint(address(new Vault()));
    }
}
```

```text
[FAIL: ERC721InvalidReceiver(0x2e234DAe75C793f67A35089C9d99245E1C58470b)] test_mint_to_plain_contract() (gas: 182370)
[PASS] test_mint_to_receiver() (gas: 569429)
Logs:
  print 1 from 0x0000000000000000000000000000000000000000
  operator 0x7FA9385bE102ac3EAc297483Dd6233D62b3e1496
```

For a mint, `from` is the zero address and `operator` is whoever called `mint`, here the test
contract. A contract that only needs to hold NFTs can inherit OpenZeppelin's `ERC721Holder`.

## The hook runs someone else's code

`_safeMint` hands control to the receiver *before your function has finished*. The receiver can
do anything, including calling you again while your state is half updated. This is
**reentrancy**, the bug behind some of the largest losses in Ethereum's history (Advanced 02
covers it fully). A free badge, one per address:

```solidity
contract OpenDayBadge is ERC721 {
    mapping(address => bool) public claimed;
    uint256 public nextId = 1;

    error AlreadyClaimed(address who);

    constructor() ERC721("Open Day", "OPEN") {}

    function claim() external {
        if (claimed[msg.sender]) revert AlreadyClaimed(msg.sender);
        _safeMint(msg.sender, nextId++); // calls msg.sender back if it is a contract
        claimed[msg.sender] = true;
    }
}

contract Greedy {
    OpenDayBadge badge;

    constructor(OpenDayBadge b) {
        badge = b;
    }

    function attack() external {
        badge.claim();
    }

    function onERC721Received(address, address, uint256, bytes calldata) external returns (bytes4) {
        if (badge.balanceOf(address(this)) < 5) badge.claim(); // claim again, mid-mint
        return this.onERC721Received.selector;
    }
}
```

A test deploys both, calls `greedy.attack()` once and logs Greedy's balance:

```text
Logs:
  badges held by one address: 5
```

Each nested `claim` still sees `claimed` as false. The fix is **checks-effects-interactions**:
check, then write your state, then call out. Swap the two lines:

```solidity
        claimed[msg.sender] = true; // effects first
        _safeMint(msg.sender, nextId++); // then the call out
```

```text
[FAIL: AlreadyClaimed(0x2e234DAe75C793f67A35089C9d99245E1C58470b)] test_reenter_through_the_hook() (gas: 2378063)
```

The second claim now reverts, and the revert unwinds the whole attack. Treat every `_safeMint`
and `safeTransferFrom` like sending ether: finish your own bookkeeping first.

## Metadata and tokenURI

The optional metadata extension adds `name()`, `symbol()` and `tokenURI(id)`, a link to a JSON
document with `name`, `description` and `image`. OpenZeppelin builds it as `_baseURI()` plus the
id, and reverts with `ERC721NonexistentToken(id)` for an id nobody owns. Where the JSON lives
matters: an `https://` server can change or vanish; an `ipfs://` link names the content by its
hash, so it cannot change; a `data:` URI keeps it on-chain. Whoever can change the base URI
controls what every token shows. `ERC721URIStorage` stores one URI per token instead.

## Changing the rules in _update

In OpenZeppelin 5.x every mint, transfer and burn goes through one internal function,
`_update(to, tokenId, auth)`, which returns the previous owner. It replaced 4.x's
`_beforeTokenTransfer` and `_afterTokenTransfer` hooks. Override it to add a rule, call
`super._update` and return its result (Practice 1 makes certificates that cannot be transferred).

## ERC-1155 and ERC-165

**ERC-1155** is a **multi-token** standard: one contract holds many token types, and
`balanceOf(account, id)` takes the id too. A type with many units is fungible; a type with a
supply of one is an NFT. It adds batch calls (`safeBatchTransferFrom`, `balanceOfBatch`), has
only operator approvals, and every transfer is safe: contract receivers must implement
`onERC1155Received`, the same reentrancy point. `uri(id)` returns one template in which clients
replace `{id}` with the id as 64 hex digits.

How does a marketplace know which standard a contract speaks? **ERC-165**:
`supportsInterface(bytes4 id)` returns true for every interface the contract implements. An
**interface id** is the XOR of the interface's function selectors.

```solidity
contract FestivalItems is ERC1155 {
    constructor() ERC1155("https://festival.example/items/{id}.json") {
        _mint(msg.sender, 1, 500, ""); // 500 identical tickets
        _mint(msg.sender, 2, 1, ""); // one signed poster
    }
}

// in the test (which implements onERC1155Received):
console.logBytes4(type(IERC165).interfaceId);
console.logBytes4(type(IERC721).interfaceId);
console.logBytes4(type(IERC1155).interfaceId);
console.log("1155?", items.supportsInterface(type(IERC1155).interfaceId));
console.log("721?", items.supportsInterface(type(IERC721).interfaceId));
console.log("tickets:", items.balanceOf(address(this), 1));
console.log("posters:", items.balanceOf(address(this), 2));
```

```text
  0x01ffc9a7
  0x80ac58cd
  0xd9b67a26
  1155? true
  721? false
  tickets: 500
  posters: 1
```

## Common mistakes

- **Minting with `_mint` or moving with `transferFrom` to a contract.** No error; the token may
  be locked forever. Use `_safeMint` and `safeTransferFrom`.
- **Writing state after `_safeMint`.** One address collected 5 "one per address" badges above.
  Update state first.
- **Dropping `_update`'s result.** `super._update(to, id, auth);` without `return` compiles with
  `Warning (6321): Unnamed return variable can remain unassigned`, and every transfer fails with
  `ERC721IncorrectOwner(0x7FA9385bE102ac3EAc297483Dd6233D62b3e1496, 1, 0x0000000000000000000000000000000000000000)`.
  Write `return super._update(to, id, auth);`.
- **Moving someone else's token unapproved.** `ERC721InsufficientApproval(0x7FA9385bE102ac3EAc297483Dd6233D62b3e1496, 1)`.
  The owner must call `approve` or `setApprovalForAll` first.

## Practice

1. Write `Certificates`, an ERC-721 whose tokens can be minted and burned but never transferred:
   revert with `Soulbound(id)`.
2. What does `getApproved(id)` return after a transfer, and why?
3. What is the interface id of `interface IBell { function ring() external; }`?

### Answers

```solidity
contract Certificates is ERC721 {
    error Soulbound(uint256 id);

    constructor() ERC721("Course Certificates", "CERT") {}

    function award(address to, uint256 id) external {
        _safeMint(to, id);
    }

    function _update(address to, uint256 id, address auth) internal override returns (address) {
        address from = _ownerOf(id);
        if (from != address(0) && to != address(0)) revert Soulbound(id);
        return super._update(to, id, auth);
    }
}
```

A test expects `Soulbound(7)` when `ana` transfers, then prints the interface id and the selector:

```text
[PASS] test_certificates_do_not_move() (gas: 1940035)
Logs:
  still ana's: true

[PASS] test_interface_id_of_one_function() (gas: 6322)
Logs:
  0x8360c185
  0x8360c185
```

2. The zero address: every transfer clears the approval, so the new owner starts clean.
3. `0x8360c185`, the selector of `ring()`: the XOR of a single selector is that selector.

## Key takeaways

- An NFT is an id with one owner; the owner, its approved address or an operator may move it.
- `setApprovalForAll` grants every token in the contract; grant it only to code you trust.
- Mint and send with `_safeMint` and `safeTransferFrom`, and finish your state changes first:
  the receiver hook runs other people's code.
- Customise OpenZeppelin 5.x tokens by overriding `_update` and returning `super._update`.
- ERC-1155 puts many token types in one contract; ERC-165 tells callers what a contract supports.

## Further reading

- [ERC-721: Non-Fungible Token Standard](https://eips.ethereum.org/EIPS/eip-721)
- [ERC-1155: Multi Token Standard](https://eips.ethereum.org/EIPS/eip-1155)
- [OpenZeppelin Contracts 5.x: ERC-721 API](https://docs.openzeppelin.com/contracts/5.x/api/token/erc721)
- [ERC-165: Standard Interface Detection](https://eips.ethereum.org/EIPS/eip-165)
