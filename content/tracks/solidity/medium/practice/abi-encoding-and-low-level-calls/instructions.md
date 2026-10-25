`solution.sol` holds two contracts. `Turntable` is complete: it obeys only its `panel`, and
besides the three commands the crew needs (`rotate`, `openGate`, `closeGate`) it has `handOver`,
which gives the turntable to another panel. Complete `TurntablePanel`, whose state, errors and
`addOperator` are written for you.

1. **`function rotateCommand(uint16 degrees) public pure returns (bytes memory)`** returns the
   calldata of `Turntable.rotate(degrees)`. Build it with `abi.encodeCall`.
2. **`function send(address turntable, bytes calldata command) external returns (bytes memory)`**
   relays `command` to `turntable` with a low-level `call`. Check, in this order:
   - the caller is an operator, or revert with `NotOperator(msg.sender)`;
   - the command's selector is `Turntable.rotate.selector`, `Turntable.openGate.selector` or
     `Turntable.closeGate.selector`, or revert with `ForbiddenCommand(selector)`.
     `bytes4(command)` gives the first four bytes; when the command is shorter, the missing bytes
     count as zero, so `hex"1003"` is refused with `ForbiddenCommand(0x10030000)`;
   - `turntable` has code, or revert with `NoCode(turntable)`.

   If the call fails, revert with exactly the turntable's revert data (a custom error or a revert
   string), using the two lines of assembly from the lesson. Otherwise return what the turntable
   returned.
3. **`function headingOf(address turntable) external view returns (uint16)`** reads
   `Turntable.heading()` with `staticcall`. If the call fails or does not return exactly one
   32-byte word, revert with `ReadFailed()`; otherwise decode and return the heading.

```solidity
TurntablePanel panel = new TurntablePanel(); // the deployer is an operator
Turntable turntable = new Turntable(address(panel));
panel.rotateCommand(90); // == abi.encodeWithSignature("rotate(uint16)", uint16(90))
panel.send(address(turntable), panel.rotateCommand(90)); // returns abi.encode(uint16(90))
panel.headingOf(address(turntable)); // 90
panel.send(address(turntable), abi.encodeCall(Turntable.handOver, (address(this))));
// reverts with ForbiddenCommand(Turntable.handOver.selector)
panel.send(address(turntable), panel.rotateCommand(400));
// reverts with BadHeading(400), the turntable's own error
```
