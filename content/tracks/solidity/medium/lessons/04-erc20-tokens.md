---
title: ERC-20 Tokens
summary: Learn what a token standard is, implement the ERC-20 interface by hand with balances, allowances and events, understand the approve race and how wallets avoid it, then build a capped, burnable token on OpenZeppelin 5's ERC20 with the _update hook, and test it.
minutes: 40
objectives:
  - Explain what an EIP and an ERC are and list the functions and events ERC-20 requires
  - Write a minimal ERC-20 with transfer, approve, allowance, transferFrom and decimals
  - Describe the approve race and the habits that limit what a spender can take
  - Build and test a token on OpenZeppelin's ERC20, customised through _update with its custom errors
---

## Outline

1. Standards: EIPs and ERCs
2. The ERC-20 interface
3. A minimal ERC-20 by hand
4. Allowances and the approve race
5. OpenZeppelin's ERC20
6. Customising with _update
7. Testing a token

## Standards: EIPs and ERCs

An **EIP** (Ethereum Improvement Proposal) is a design document for Ethereum. EIPs that set
application-level conventions, such as contract interfaces, form the **ERC** category. **ERC-20**,
proposed in November 2015 by Fabian Vogelsteller and Vitalik Buterin, is the standard for
**fungible tokens**: units that are all alike, like loyalty points, vouchers or shares of a pool.

A token is not a coin that travels. It is one contract holding a mapping from addresses to
balances; "sending tokens" means asking that contract to change two entries. Because every ERC-20
offers the same functions, any wallet, exchange or contract can handle tokens it has never seen.

## The ERC-20 interface

OpenZeppelin's `IERC20`, without its comments, is exactly what the standard requires:

```solidity
interface IERC20 {
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 value) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}
```

`name`, `symbol` and `decimals` are optional extras (`IERC20Metadata`). Balances are integers in
the token's smallest unit; **decimals** only tells wallets where to put the point. With the usual
18, `1e18` units display as 1 token. `Transfer` must be emitted for every transfer, zero included;
a newly minted amount is a `Transfer` from `address(0)`. The `bool` results matter: the standard
says callers must handle `false`, so a contract that calls `token.transfer(...)` checks the
result and reverts on `false`. Some old tokens return nothing at all; Medium 11's `SafeERC20`
handles both.

## A minimal ERC-20 by hand

```solidity
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @notice A minimal ERC-20, written by hand to show the moving parts.
contract PlainToken is IERC20 {
    error InsufficientBalance(address from, uint256 balance, uint256 needed);
    error InsufficientAllowance(address spender, uint256 allowance, uint256 needed);
    error ZeroAddress();

    string public constant name = "Plain Token";
    string public constant symbol = "PLN";
    uint8 public constant decimals = 18;

    uint256 public totalSupply;
    mapping(address account => uint256) public balanceOf;
    mapping(address owner => mapping(address spender => uint256)) public allowance;

    constructor(uint256 supply) {
        totalSupply = supply;
        balanceOf[msg.sender] = supply;
        emit Transfer(address(0), msg.sender, supply); // a mint is a transfer from address(0)
    }

    function transfer(address to, uint256 value) external returns (bool) {
        _move(msg.sender, to, value);
        return true;
    }

    function approve(address spender, uint256 value) external returns (bool) {
        allowance[msg.sender][spender] = value; // replaces, does not add
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        if (allowed < value) revert InsufficientAllowance(msg.sender, allowed, value);
        allowance[from][msg.sender] = allowed - value;
        _move(from, to, value);
        return true;
    }

    function _move(address from, address to, uint256 value) private {
        if (to == address(0)) revert ZeroAddress();
        uint256 balance = balanceOf[from];
        if (balance < value) revert InsufficientBalance(from, balance, value);
        balanceOf[from] = balance - value;
        balanceOf[to] += value;
        emit Transfer(from, to, value);
    }
}
```

The public state variables implement the interface's view functions, and the events come from
`IERC20`. A test approves a shop for 30 tokens; the shop takes 25, then tries 10 more:

```text
[FAIL: InsufficientAllowance(0xFE1b784B1144E92BC109D985ae82127C5338Af72, 5000000000000000000 [5e18], 10000000000000000000 [1e19])] test_pay_a_shop() (gas: 175706)
Logs:
  shop balance 25000000000000000000
  allowance left 5000000000000000000
```

## Allowances and the approve race

`approve` plus `transferFrom` is how contracts take payment in tokens: you approve a shop, then
call the shop, which calls `token.transferFrom(you, shop, price)` through the interface. The
allowance caps what it can take.

`approve` **replaces** the allowance, and that opens a race. Alice has approved Bob for 100 and
sends `approve(bob, 50)` to lower it. Bob sees her transaction waiting to be included (Advanced 05
explains how) and gets his `transferFrom` of 100 in first; once her approval lands he takes 50
more. A test replays that order:

```text
  Bob took 150 coupons
```

The standard leaves the fix to clients: set an allowance to 0 before setting a new one, and
approve exact amounts rather than "unlimited" (`type(uint256).max`), which lets a buggy or
malicious spender take everything you will ever hold. Wallets show the spending cap and let you
edit it. OpenZeppelin 5 removed its non-standard `increaseAllowance` and `decreaseAllowance`;
signed approvals (`permit`) come in Advanced 07.

## OpenZeppelin's ERC20

Production tokens build on audited code. `ERC20` in OpenZeppelin 5.7 takes the name and symbol in
its constructor, defaults `decimals()` to 18, and gives you internal `_mint`, `_burn` and
`_transfer`. Its errors come from ERC-6093: `ERC20InsufficientBalance(sender, balance, needed)`,
`ERC20InsufficientAllowance(spender, allowance, needed)`, `ERC20InvalidReceiver(receiver)` and
others. Two details: an allowance of `type(uint256).max` is never decreased, and `transferFrom`
does not emit `Approval`.

## Customising with _update

In 5.x every mint, burn and transfer goes through one internal virtual function, **`_update(from,
to, value)`**; `from` is zero for a mint, `to` for a burn. `_mint`, `_burn` and `_transfer` are not
virtual: you customise by overriding `_update` and calling `super._update`. The extensions work
the same way: `ERC20Capped` overrides `_update` to enforce a maximum supply, and `ERC20Burnable`
adds `burn` and `burnFrom`.

```solidity
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {ERC20Capped} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";

/// @notice Mooring credits: minted by the harbour office, capped, burnable by holders.
contract MooringCredit is ERC20, ERC20Burnable, ERC20Capped {
    error NotHarbourMaster(address caller);

    address public immutable harbourMaster;

    constructor() ERC20("Mooring Credit", "MOOR") ERC20Capped(1_000_000e18) {
        harbourMaster = msg.sender;
    }

    function mint(address to, uint256 amount) external {
        if (msg.sender != harbourMaster) revert NotHarbourMaster(msg.sender);
        _mint(to, amount);
    }

    /// @dev Every mint, burn and transfer passes through here.
    function _update(address from, address to, uint256 value) internal override(ERC20, ERC20Capped) {
        // Tokens sent to the token contract itself would be stuck forever.
        if (to == address(this)) revert ERC20InvalidReceiver(to);
        super._update(from, to, value);
    }
}
```

The check on `mint` matters most: without it anyone could print credits. The `_update` rule stops
a common loss, tokens sent to the token's own address, which no one can ever move again.

## Testing a token

Test every rule and every error. `vm.expectRevert` with
`abi.encodeWithSelector(IERC20Errors.ERC20InsufficientBalance.selector, skipper, 0, 1)` pins the
exact error, and a fuzz test checks that a transfer never creates or destroys tokens:

```solidity
function testFuzz_transfer_keeps_the_supply(uint256 minted, uint256 sent) public {
    minted = bound(minted, 0, credit.cap());
    sent = bound(sent, 0, minted);
    credit.mint(skipper, minted);
    vm.prank(skipper);
    credit.transfer(address(0xD0C), sent);
    assertEq(credit.balanceOf(skipper) + credit.balanceOf(address(0xD0C)), minted, "balances add up");
    assertEq(credit.totalSupply(), minted, "a transfer changes no supply");
}
```

The suite for `MooringCredit` (the three failures are tests written to show each error):

```text
[PASS] testFuzz_transfer_keeps_the_supply(uint256,uint256) (runs: 256, μ: 160905, ~: 163428)
[PASS] test_lifecycle() (gas: 196443)
Logs:
  skipper 300000000000000000000
  supply 420000000000000000000
  decimals 18

[FAIL: ERC20ExceededCap(1000001000000000000000000 [1e24], 1000000000000000000000000 [1e24])] test_over_the_cap() (gas: 77356)
[FAIL: ERC20InsufficientBalance(0x51c1c5a3d7C9c75EFE375Ed4d73b95aF12C60556, 0, 1)] test_overspend() (gas: 35702)
[FAIL: ERC20InvalidReceiver(0x5615dEB798BB3E4dFa0139dFa1b3D433Cc23b72f)] test_to_the_token() (gas: 104023)
```

The skipper received 500, sent 120 and burnt 80; the burn lowered the supply.

## Common mistakes

- **A bare `override` on `_update`.** Both `ERC20` and `ERC20Capped` define it: `Error (4327):
  Function needs to specify overridden contracts "ERC20" and "ERC20Capped".`
- **Forgetting `super._update`.** Nothing moves: after minting 100 tokens a test logs `balance 0`
  and `supply 0`.
- **Forgetting decimals.** `transfer(to, 5)` sends 5 units, 0.000000000000000005 tokens. Write
  `5e18`, or `5 * 10 ** decimals()`.
- **Caching both balances.** Reading `balanceOf[to]` before writing `balanceOf[from]` breaks
  transfers to yourself (see the practice answers).

## Practice

1. Write `TicketToken`, an OpenZeppelin token of whole tickets (0 decimals) with 500 minted to the
   deployer.
2. Test that a spender approved for 3 tickets who takes 4 gets `ERC20InsufficientAllowance`.
3. A token's `transfer` reads `fromBalance` and `toBalance` first, then writes `fromBalance -
   value` and `toBalance + value`. What does sending 40 to yourself from a balance of 100 do?

### Answers

```solidity
contract TicketToken is ERC20 {
    constructor() ERC20("Bus Ticket", "BUS") {
        _mint(msg.sender, 500);
    }

    function decimals() public pure override returns (uint8) {
        return 0;
    }
}

// 2. in a test:
tickets.approve(agent, 3);
vm.expectRevert(abi.encodeWithSelector(IERC20Errors.ERC20InsufficientAllowance.selector, agent, 3, 4));
vm.prank(agent);
tickets.transferFrom(address(this), agent, 4);

// 3. the transfer in question, run from a balance of 100:
uint256 fromBalance = balanceOf[msg.sender];
uint256 toBalance = balanceOf[to];
require(fromBalance >= value, "balance too low");
balanceOf[msg.sender] = fromBalance - value;
balanceOf[to] = toBalance + value;
```

```text
[PASS] test_insufficient_allowance() (gas: 1054453)
[PASS] test_send_to_yourself() (gas: 402710)
Logs:
  after sending 40 to myself 140

[PASS] test_whole_tickets() (gas: 984074)
Logs:
  decimals 0 balance 500
```

The second write overwrote the first with the stale `toBalance`: 40 tokens appeared from nothing.

## Key takeaways

- ERC-20 is six functions and two events; a token is one contract's balance mapping.
- Amounts are integers in the smallest unit; `decimals` is for display.
- `approve` replaces the allowance: approve exact amounts and reset to 0 before changing one.
- On OpenZeppelin 5, customise through `_update`, call `super`, and name every base in `override`.
- Guard minting, and test each rule, each error and the supply with a fuzz test.

## Further reading

- [ERC-20: Token Standard (EIP-20)](https://eips.ethereum.org/EIPS/eip-20)
- [OpenZeppelin Contracts 5.x: ERC-20 API](https://docs.openzeppelin.com/contracts/5.x/api/token/erc20)
- [ethereum.org: ERC-20 token standard](https://ethereum.org/en/developers/docs/standards/tokens/erc-20/)
