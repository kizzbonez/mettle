---
title: Foundry and a First Contract
summary: Install Foundry, create a project with forge init, read the parts of a contract, build it into bytecode and an ABI, write and run a first test with setUp, test functions and assertEq, print with console.log, format with forge fmt, and know when Remix is enough.
minutes: 30
objectives:
  - Install Foundry and create a project, and say what src, test, script, lib and foundry.toml hold
  - Name the parts of a contract file (licence, pragma, contract, state variable, function) and build it
  - Explain what the bytecode and the ABI that forge build produces are for
  - Write a test contract with setUp and test_ functions, run it with forge test, and read its result
---

## Outline

1. Installing Foundry
2. A new project
3. The parts of a contract
4. Building: bytecode and the ABI
5. A first test
6. Printing with console.log
7. Formatting with forge fmt
8. Remix, in the browser

## Installing Foundry

**Foundry** is a toolkit for building, testing and deploying contracts, written in Rust and driven
from the terminal. Its tests are written in Solidity, like the contracts. Install it with its
installer, **foundryup**, on macOS or Linux; on Windows, run the same commands inside WSL (the
Windows Subsystem for Linux) or Git Bash, since PowerShell and Command Prompt are not supported:

```sh
curl -L https://foundry.paradigm.xyz | bash
foundryup
forge --version
```

```text
forge Version: 1.8.6
Commit SHA: 6bad0a66de7c83f7b33695044138f0f5fa4c5990
Build Timestamp: 2026-10-21T19:24:36.040754853Z (1792610676)
Build Profile: dist
```

foundryup installs four programs: **forge** (build, test, deploy), **cast** (talk to a chain from
the terminal), **anvil** (a local chain) and **chisel** (a Solidity prompt). Run `foundryup` again
to update. The labs need none of this: they run Foundry for you.

## A new project

`forge init swifts` creates a project folder, starts a git repository in it and downloads
forge-std, so it needs git and a network connection:

- `src/` holds your contracts (`Counter.sol` as a sample).
- `test/` holds tests, named `*.t.sol`.
- `script/` holds deployment scripts, named `*.s.sol` (Medium 12).
- `lib/` holds libraries, starting with **forge-std**, Foundry's standard library for tests.
- `foundry.toml` is the configuration, such as which compiler to use.

`forge build` writes the compiled results to `out/` and a cache to `cache/`.

## The parts of a contract

Replace the sample with your own file, `src/SwiftTally.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title The swifts counted from the church tower this summer
contract SwiftTally {
    uint256 public count;

    /// @notice Adds `seen` swifts to the tally.
    function record(uint256 seen) public {
        count = count + seen;
    }
}
```

- The **SPDX licence identifier** says under which licence the source is published. Contract
  source is usually published; the compiler warns when the line is missing (forge hides that).
- The **version pragma** says which compilers may build the file. `^0.8.24` means 0.8.24 or later,
  but before 0.9.0, which may break things. It protects you from a compiler that would read the
  code differently.
- `contract SwiftTally { ... }` declares a contract, the unit you deploy. Statements end with `;`.
- `uint256 public count;` is a **state variable**, kept in the contract's storage. It starts at 0,
  and `public` makes the compiler write a function `count()` that returns it.
- `record` is a **function**. `public` lets anyone call it, and every call is a transaction that
  changes storage. Lesson 04 covers functions in full.
- `///` comments are **NatSpec**, documentation that tools read; `@notice` is shown to users.

## Building: bytecode and the ABI

```sh
forge build
```

```text
Compiling 21 files with Solc 0.8.38
Solc 0.8.38 finished in 840.54ms
Compiler run successful!
```

Twenty-one files, because the test below and the parts of forge-std it imports are compiled too.
The result, `out/SwiftTally.sol/SwiftTally.json`, holds two things:

- The **bytecode**: the EVM instructions that a deployment stores at the contract's address.
  `forge inspect SwiftTally deployedBytecode` prints it in hexadecimal: 428 bytes starting
  `0x608060405234801561000f575f5ffd5b50...`.
- The **ABI** (Application Binary Interface): a JSON list of the contract's functions, their
  parameters and results. Wallets, websites and tests read it to know how to encode a call.

```sh
forge inspect SwiftTally abi
```

```text
╭----------+--------------------------------+------------╮
| Type     | Signature                      | Selector   |
+========================================================+
| function | count() view returns (uint256) | 0x06661abd |
|----------+--------------------------------+------------|
| function | record(uint256) nonpayable     | 0x2c16cd8a |
╰----------+--------------------------------+------------╯
```

`count()` is the getter that `public` created; **view** means it only reads. The **selector** is
the four bytes that pick the function in a call's data (Medium 06). Add `--json` for the ABI
itself.

## A first test

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {SwiftTally} from "../src/SwiftTally.sol";

contract SwiftTallyTest is Test {
    SwiftTally tally;

    function setUp() public {
        tally = new SwiftTally();
    }

    function test_starts_at_zero() public view {
        assertEq(tally.count(), 0, "count of a new tally");
    }

    function test_adds_each_record() public {
        tally.record(12);
        tally.record(5);
        console.log("after two records:", tally.count());
        assertEq(tally.count(), 17, "count after recording 12 and 5");
    }
}
```

- A test file in `test/` holds a contract that inherits forge-std's **Test** (`is Test`), which
  brings `assertEq`, `console` and the cheatcodes of lesson 04.
- **`setUp`** runs before *each* test, so every test starts with a fresh contract: one test's
  changes never leak into another. `new SwiftTally()` deploys a contract.
- Every public function whose name starts with **`test`** is a test. It passes if it finishes and
  fails if any check or call inside it fails.
- **`assertEq(actual, expected, message)`** fails the test when the two differ. Always give the
  message: it says what was checked.

```sh
forge test -vv
```

```text
Ran 2 tests for test/SwiftTally.t.sol:SwiftTallyTest
[PASS] test_adds_each_record() (gas: 91238)
Logs:
  after two records: 17

[PASS] test_starts_at_zero() (gas: 7905)
Suite result: ok. 2 passed; 0 failed; 0 skipped; finished in 1.46ms (552.69µs CPU time)
```

With `count = seen;` in `record` instead, the result names the check and both values, actual
first:

```text
[FAIL: count after recording 12 and 5: 5 != 17] test_adds_each_record() (gas: 94305)
[PASS] test_starts_at_zero() (gas: 7905)
```

`--match-test test_adds_each_record` runs one test; `-vvvv` adds a **trace** of every call.

## Printing with console.log

`console.log` (imported from forge-std above) prints from tests and contracts while Foundry runs
them, up to four values at a time; `-vv` shows the logs. On a real chain it does nothing but cost
gas, so remove it from contracts before deploying.

## Formatting with forge fmt

`forge fmt` lays out every file in one standard style: four spaces, double quotes, a blank line
between functions. `forge fmt --check` only reports, which suits automated checks:

```text
Diff in src/SwiftTally.sol:
1   1    | // SPDX-License-Identifier: MIT
2   2    | pragma solidity ^0.8.24;
3   3    | 
4        |-contract SwiftTally{
5        |-  uint256 public count;
6        |-  function record(uint256 seen) public {count=count+seen;}
    4    |+contract SwiftTally {
    5    |+    uint256 public count;
    6    |+
    7    |+    function record(uint256 seen) public {
    8    |+        count = count + seen;
    9    |+    }
7   10   | }
```

## Remix, in the browser

**Remix** (remix.ethereum.org) is an editor and compiler in the browser. It deploys to the
**Remix VM**, a sandbox chain in the page, and gives each function a button. It is handy for a
quick experiment; for code you keep, with tests, use Foundry.

## Common mistakes

- **A test name without `test`.** `function adds_each_record()` never runs; with no other tests,
  forge says ``Warning: No tests found in project! Forge looks for functions that start with
  `test` ``. Name it `test_adds_each_record`.
- **A missing semicolon.** `count = count + seen` gives `Error (2314): Expected ';' but got '}'`
  at the next line. The error points just after the mistake.
- **A bare number in console.log.** `console.log("price:", 1 ether)` fails with
  `Error (6675): Member "log" not unique after argument-dependent lookup in type(library console).`,
  because a literal fits several types. Write `uint256(1 ether)`.
- **A test contract without `is Test`.** Every check then fails to build with
  `Error (7576): Undeclared identifier. Did you mean "assert"?` under `assertEq`. Inherit `Test`.

## Practice

1. Add `reset()`, which sets the count back to 0, and a test that records 40, resets, records 3
   and checks the count.
2. Write `test_adds_twice`, which records 8 twice.
3. Would `pragma solidity ^0.8.24;` build with 0.8.38? With 0.9.0?

### Answers

```solidity
// in SwiftTally
function reset() public {
    count = 0;
}

// in SwiftTallyTest
function test_reset_starts_again() public {
    tally.record(40);
    tally.reset();
    tally.record(3);
    assertEq(tally.count(), 3, "count after a reset and one record");
}

function test_adds_twice() public {
    tally.record(8);
    tally.record(8);
    assertEq(tally.count(), 16, "count after recording 8 twice");
}
```

```text
[PASS] test_adds_twice() (gas: 80216)
[PASS] test_reset_starts_again() (gas: 119261)
Suite result: ok. 2 passed; 0 failed; 0 skipped; finished in 5.77ms (1.84ms CPU time)
```

3. 0.8.38, yes: it is 0.8.24 or later. 0.9.0, no: `^` stops before the next breaking version.

## Key takeaways

- `forge init` makes `src/`, `test/`, `script/`, `lib/` and `foundry.toml`; `forge build`
  compiles, `forge test` tests.
- A contract file starts with an SPDX line and a version pragma.
- Building gives bytecode for the EVM and an ABI for everyone who calls the contract.
- Tests inherit `Test`; `setUp` runs before each `test...` function; `assertEq` takes a message.
- `console.log` is for tests; `forge fmt` keeps the style consistent.

## Further reading

- [Foundry documentation: Installation](https://getfoundry.sh/introduction/installation)
- [Foundry documentation: Writing tests](https://getfoundry.sh/forge/tests/writing-tests)
- [Solidity documentation: Layout of a Solidity source file](https://docs.soliditylang.org/en/latest/layout-of-source-files.html)
- [Remix documentation: Deploy and run](https://remix-ide.readthedocs.io/en/latest/run.html)
