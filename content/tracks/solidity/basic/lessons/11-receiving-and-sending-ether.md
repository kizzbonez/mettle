---
title: Receiving and Sending Ether
summary: Accept ether with payable functions, receive and fallback, keep your own records of who paid what, send ether with call and check the result, avoid the deprecated transfer and send, and let users withdraw their own money.
minutes: 40
objectives:
  - Accept ether through payable functions and receive(), and predict whether receive, fallback or neither runs for a call
  - Record each account's ether in a mapping and check it against balances in tests with vm.deal
  - Send ether with a low-level call, revert with a custom error when it fails, and explain why transfer and send are deprecated
  - Apply the pull pattern to withdrawals and refunds, updating state before sending
---

## Outline

1. Payable functions and msg.value
2. receive and fallback
3. Sending ether with call
4. Why not transfer or send
5. Pull, don't push

## Payable functions and msg.value

Contracts can hold ether. A function marked **`payable`** accepts ether with the call, and inside
it **`msg.value`** is the amount sent, in wei. A function without `payable` refuses any ether: the
call reverts. **`address(this).balance`** is the ether the contract holds right now.

A contract that holds other people's money must also record whose money it is. The balance tells
you the total, not who owns it, so keep your own books in a mapping. Here is a hiking club's
kitty, where members put money aside and take it out again:

```solidity
contract TrailKitty {
    mapping(address => uint256) public balanceOf;

    event Deposited(address indexed member, uint256 amount);
    event Withdrawn(address indexed member, uint256 amount);

    error NothingToWithdraw();
    error TransferFailed(address to, uint256 amount);

    function deposit() public payable {
        balanceOf[msg.sender] += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    receive() external payable {
        deposit();
    }

    function withdraw() external {
        uint256 amount = balanceOf[msg.sender];
        if (amount == 0) revert NothingToWithdraw();
        balanceOf[msg.sender] = 0; // update state before sending
        (bool ok,) = msg.sender.call{value: amount}("");
        if (!ok) revert TransferFailed(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }
}

contract TrailKittyTest is Test {
    TrailKitty kitty = new TrailKitty();
    address ada = address(0xA11CE);

    function test_deposit_send_and_withdraw() public {
        vm.deal(ada, 1 ether);

        vm.prank(ada);
        kitty.deposit{value: 0.3 ether}();
        vm.prank(ada);
        (bool ok,) = address(kitty).call{value: 0.2 ether}("");
        assertTrue(ok, "plain transfer accepted");

        assertEq(kitty.balanceOf(ada), 0.5 ether, "Ada's balance in the kitty");
        assertEq(address(kitty).balance, 0.5 ether, "ether held by the kitty");
        assertEq(ada.balance, 0.5 ether, "ether left in Ada's account");

        vm.prank(ada);
        kitty.withdraw();
        assertEq(ada.balance, 1 ether, "Ada's ether after withdrawing");
        assertEq(address(kitty).balance, 0, "ether left in the kitty");
    }
}
```

```text
[PASS] test_deposit_send_and_withdraw() (gas: 147572)
```

In a test, **`vm.deal(account, amount)`** sets an account's balance, and
`kitty.deposit{value: 0.3 ether}()` attaches ether to a call. `address(kitty).call{value: ...}("")`
sends ether with no function call at all, as a wallet does when you "send" money to an address.

## receive and fallback

What runs when a call names no function? A contract may have two special functions, declared
without the `function` keyword:

- **`receive() external payable`** runs when the call data is empty: a plain ether transfer.
- **`fallback() external [payable]`** runs when the data matches no function, and also for empty
  data if there is no `receive`. It accepts ether only if it is `payable`.

If neither can take the ether, the transfer fails. `console.log` works inside contracts during
tests, which makes this easy to watch:

```solidity
contract Doorbell {
    receive() external payable {
        console.log("receive", msg.value);
    }

    fallback() external payable {
        console.log("fallback", msg.value, msg.data.length);
    }
}

contract NoDoor {}

contract WhichTest is Test {
    function test_which_function_runs() public {
        Doorbell bell = new Doorbell();
        bool ok;
        (ok,) = address(bell).call{value: 5}("");
        (ok,) = address(bell).call{value: 5}(hex"c0ffee");
        (ok,) = address(bell).call(hex"c0ffee");

        (ok,) = address(new NoDoor()).call{value: 5}("");
        console.log("contract without receive or fallback accepted ether:", ok);
    }
}
```

```text
[PASS] test_which_function_runs() (gas: 490277)
Logs:
  receive 5
  fallback 5 3
  fallback 0 3
  contract without receive or fallback accepted ether: false
```

Give a contract a `receive` only if plain transfers make sense for it, and keep it small. Add a
`fallback` only when you need one: without it, a call to a function that does not exist simply
reverts, which is usually what you want.

## Sending ether with call

To pay an account, use a low-level **`call`** with a value and empty data, and check the result:

```solidity
(bool ok,) = to.call{value: amount}("");
if (!ok) revert TransferFailed(to, amount);
```

`call` does not revert on its own when the recipient refuses; it returns `false`. Ignoring that
flag is a classic bug. The compiler warns with `Warning (9302): Return value of low-level calls
not used.`, and the money stays in your contract while your records say it was paid. Reverting
undoes the whole withdrawal, so the member keeps their balance and can try again from an account
that accepts ether.

`call` passes almost all remaining gas to the recipient, so a contract wallet can run real code
when it is paid. It can also call back into your contract before your function has finished.
Hence the comment in `withdraw`: set the balance to zero **before** sending, so a callback finds
nothing left to take. Advanced 02 shows that attack, called reentrancy.

## Why not transfer or send

Older code pays with `payable(to).transfer(amount)` or `send`. Both give the recipient only a
**2300 gas stipend**, enough to log an event but not to write storage. That limit was meant as
protection, but the gas cost of operations changes between forks: EIP-1884 (2019) made reading
storage dearer and broke contracts whose `receive` had fit before. Since Solidity 0.8.31 both are
deprecated and will be removed in 0.9. Two tests pay a hut's logbook, whose `receive` counts
gifts in storage, once with each function:

```solidity
contract HutLogbook {
    uint256 public gifts;

    receive() external payable {
        gifts += 1; // a storage write: more than 2300 gas
    }
}

contract Payer {
    error TransferFailed(address to, uint256 amount);

    function payWithTransfer(address payable to) external {
        to.transfer(1 wei);
    }

    function payWithCall(address to) external {
        (bool ok,) = to.call{value: 1 wei}("");
        if (!ok) revert TransferFailed(to, 1 wei);
    }
}
```

```text
Warning (9207): 'transfer' is deprecated and scheduled for removal. Use 'call{value: <amount>}("")' instead.
  --> test/Example.t.sol:18:9:
   |
18 |         to.transfer(1 wei);
   |         ^^^^^^^^^^^

[PASS] test_call() (gas: 64581)
[FAIL: EvmError: Revert] test_transfer() (gas: 41124)
```

`forge test -vvvv` shows why:

```text
    ├─ [33583] Payer::payWithTransfer(HutLogbook: [0x5615dEB798BB3E4dFa0139dFa1b3D433Cc23b72f])
    │   ├─ [2300] HutLogbook::receive{value: 1}()
    │   │   └─ ← [OutOfGas] EvmError: OutOfGas
```

## Pull, don't push

The kitty never sends anyone money on its own initiative: each member calls `withdraw` for
their own balance. That is the **pull pattern** (also called the withdrawal pattern). The
opposite, **pushing** payments inside other logic, such as paying the previous leader inside
`placeBid`, lets one recipient that refuses ether make that function revert for everybody.
With pull payments a refusing account blocks only its own withdrawal.

**Refunds** follow the same rule. When someone pays more than a price, credit the change to
their balance and let them withdraw it with everything else (Practice 1). Advanced 09 shows
what push payments to many accounts can break.

## Common mistakes

- **Sending ether to a function that is not payable.** From another contract,
  `kitty.deposit{value: msg.value}()` does not compile: `Error (7006): Cannot set option "value"
  on a non-payable function type.` Mark the function `payable`.
- **Ignoring `call`'s result.** `Warning (9302): Return value of low-level calls not used.` In a
  test, a member contract that refuses ether withdrew 1 ether: its recorded balance became 0 and
  the kitty still held the ether. Check `ok` and revert.
- **Calling `transfer` on `msg.sender`.** `Error (9862): "send" and "transfer" are only
  available for objects of type "address payable", not "address".` Do not add `payable(...)`:
  use `call`.
- **Sending before updating state.** Zero the balance first, then send.
- **Treating `address(this).balance` as your books.** Ether can be forced into a contract
  without calling it (Advanced 09), so per-member records live in a mapping.

## Practice

1. Add `buyMap()` to `TrailKitty`: a map costs `MAP_PRICE = 0.01 ether` (a `constant`). Less
   reverts with `WrongPayment(sent, price)`; any change is credited to the buyer's balance.
2. A member is a contract without `receive` or `fallback`. What happens when it calls
   `withdraw`, and does it lose its balance?
3. Does a contract whose only special function is `fallback() external {}` accept a plain
   transfer?

### Answers

```solidity
uint256 public constant MAP_PRICE = 0.01 ether;
mapping(address => uint256) public mapsBought;
error WrongPayment(uint256 sent, uint256 price);

function buyMap() external payable {
    if (msg.value < MAP_PRICE) revert WrongPayment(msg.value, MAP_PRICE);
    mapsBought[msg.sender] += 1;
    balanceOf[msg.sender] += msg.value - MAP_PRICE; // the change, to withdraw later
}

// Refuser has no receive or fallback; it deposits and withdraws through the kitty.
function test_refusing_member_keeps_its_balance() public {
    Refuser member = new Refuser();
    member.join{value: 1 ether}(kitty);
    vm.expectRevert(abi.encodeWithSelector(TrailKitty.TransferFailed.selector, address(member), 1 ether));
    member.cashOut(kitty);
    assertEq(kitty.balanceOf(address(member)), 1 ether, "balance after the failed withdrawal");
}

function test_non_payable_fallback_refuses_ether() public {
    (bool ok,) = address(new QuietFallback()).call{value: 1}("");
    assertFalse(ok, "ether sent to a non-payable fallback");
}
```

```text
[PASS] test_change_is_credited() (gas: 123267)
[PASS] test_non_payable_fallback_refuses_ether() (gas: 129147)
[PASS] test_refusing_member_keeps_its_balance() (gas: 307220)
```

`test_change_is_credited` (not shown) pays 0.015 ether, finds 0.005 ether credited, and gets `WrongPayment(0.005 ether, 0.01 ether)` for a payment that is too small. The refusing member's
withdrawal reverts with `TransferFailed`, which undoes the zeroing, so its balance is safe. A
non-payable `fallback` refuses ether, so the transfer fails.

## Key takeaways

- `payable` functions and `receive` accept ether; `msg.value` is the amount; record who paid in
  a mapping.
- `receive` runs for empty call data, `fallback` for unknown functions (and empty data without
  `receive`); with neither, ether is refused.
- Pay with `(bool ok, ) = to.call{value: amount}("")` and revert when `ok` is false.
- `transfer` and `send` are deprecated: their 2300 gas stipend breaks ordinary recipients.
- Let users pull their own money, refunds included, and update state before sending.

## Further reading

- [Solidity documentation: Receive Ether Function](https://docs.soliditylang.org/en/latest/contracts.html#receive-ether-function)
- [Solidity documentation: Sending and Receiving Ether](https://docs.soliditylang.org/en/latest/security-considerations.html#sending-and-receiving-ether)
- [Solidity documentation: Withdrawal from Contracts](https://docs.soliditylang.org/en/latest/common-patterns.html#withdrawal-from-contracts)
- [EIP-1884: Repricing for trie-size-dependent opcodes](https://eips.ethereum.org/EIPS/eip-1884)
