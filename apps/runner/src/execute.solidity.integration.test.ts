import type { RunnerRequest, RunnerTest } from '@mettle/shared';
import { describe, expect, it } from 'vitest';
import { execute } from './execute';

function request(code: string, tests: string[]): RunnerRequest {
  const cases: RunnerTest[] = tests.map((body, i) => ({ id: `t${i + 1}`, name: `test ${i + 1}`, code: body }));
  return { language: 'solidity', code, fixtures: [], tests: cases, timeLimitMs: 8000, memoryMb: 512 };
}

const vault = String.raw`// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// Pays out before it updates the balance: open to reentrancy.
contract Vault {
    mapping(address => uint256) public balanceOf;

    function deposit() external payable {
        balanceOf[msg.sender] += msg.value;
    }

    function withdraw() external {
        uint256 amount = balanceOf[msg.sender];
        (bool ok,) = msg.sender.call{value: amount}("");
        require(ok, "send failed");
        balanceOf[msg.sender] = 0;
    }

    function fee(uint256) external pure returns (uint256) {
        revert("not implemented: fee");
    }

    function skipMyTest() external {
        address hevm = address(uint160(uint256(keccak256("hevm cheat code"))));
        (bool ok,) = hevm.call(abi.encodeWithSignature("skip(bool)", true));
        ok;
    }
}

contract Tide is ERC20 {
    constructor() ERC20("Tide", "TIDE") {
        _mint(msg.sender, 1000);
    }
}
`;

const thief = String.raw`contract Thief {
    Vault vault;

    constructor(Vault v) {
        vault = v;
    }

    function attack() external payable {
        vault.deposit{value: msg.value}();
        vault.withdraw();
    }

    receive() external payable {
        if (address(vault).balance >= 1 ether) vault.withdraw();
    }
}

contract ReentrancyTest is Test {
    function test_vault_resists_reentrancy() public {
        Vault target = new Vault();
        vm.deal(address(0xA11CE), 5 ether);
        vm.prank(address(0xA11CE));
        target.deposit{value: 5 ether}();
        new Thief(target).attack{value: 1 ether}();
        assertEq(address(target).balance, 5 ether, "other depositors' ether stays in the vault");
    }
}`;

describe('solidity sandbox', () => {
  it('passes correct contracts, with OpenZeppelin, cheatcodes and console output', async () => {
    const tests = [
      'contract DepositTest is Test {\n    function test_deposit() public {\n        Vault v = new Vault();\n        vm.deal(address(this), 1 ether);\n        v.deposit{value: 1 ether}();\n        assertEq(v.balanceOf(address(this)), 1 ether, "the balance after a deposit");\n        console.log("deposited", v.balanceOf(address(this)));\n    }\n}',
      'contract TokenTest is Test {\n    function test_mint() public {\n        assertEq(new Tide().balanceOf(address(this)), 1000, "the minted supply");\n    }\n}',
    ];
    const result = await execute(request(vault, tests));
    expect(result.status).toBe('passed');
    expect(result.tests[0]?.stdout).toContain('[PASS] test_deposit()\n    deposited 1000000000000000000');
  });

  it('lets a test attack the learner contract, and reports the failed assertion with both values', async () => {
    const result = await execute(request(vault, [thief]));
    expect(result.status).toBe('failed');
    expect(result.tests[0]?.stderr).toContain("FAIL: other depositors' ether stays in the vault: 0 != 5000000000000000000");
  });

  it('reports a starter placeholder and a fuzz counterexample', async () => {
    const tests = [
      'contract FeeTest is Test {\n    function test_fee() public {\n        assertEq(new Vault().fee(100), 2, "the fee on 100 wei");\n    }\n}',
      'contract FuzzTest is Test {\n    function testFuzz_small(uint8 x) public pure {\n        assertLt(x, 200, "x stays small");\n    }\n}',
    ];
    const result = await execute(request(vault, tests));
    expect(result.tests[0]?.stderr).toContain('FAIL: not implemented: fee');
    expect(result.tests[1]?.stdout).toMatch(/counterexample: args=\[\d+\]/);
  });

  it('reports which invariant broke, its reason and the calls that broke it', async () => {
    const pot = 'pragma solidity ^0.8.24;\n\ncontract Pot {\n    uint256 public total;\n\n    function add(uint256 amount) external {\n        if (amount != 7) total += amount;\n    }\n}\n';
    const invariants = [
      'contract PotHandler is Test {',
      '    Pot public pot;',
      '    uint256 public ghost;',
      '',
      '    constructor(Pot p) {',
      '        pot = p;',
      '    }',
      '',
      '    function add(uint256 amount) external {',
      '        amount = bound(amount, 1, 10);',
      '        pot.add(amount);',
      '        ghost += amount;',
      '    }',
      '}',
      '',
      'contract PotInvariants is StdInvariant, Test {',
      '    Pot pot;',
      '    PotHandler handler;',
      '',
      '    function setUp() public {',
      '        pot = new Pot();',
      '        handler = new PotHandler(pot);',
      '        targetContract(address(handler));',
      '    }',
      '',
      '    function invariant_a_never_negative() public view {',
      '        assertGe(pot.total(), 0, "the total is never negative");',
      '    }',
      '',
      '    function invariant_b_matches_ghost() public view {',
      '        assertEq(pot.total(), handler.ghost(), "the total against the handler\'s ghost");',
      '    }',
      '}',
    ].join('\n');
    const result = await execute(request(pot, [invariants]));
    expect(result.status).toBe('failed');
    expect(result.tests[0]?.stderr).toMatch(/^FAIL: the total against the handler's ghost: \d+ != \d+\n {2}in invariant_b_matches_ghost/);
    expect(result.tests[0]?.stdout).toContain('[PASS] invariant_a_never_negative()');
    expect(result.tests[0]?.stdout).toMatch(/invariant_b_matches_ghost broke after: .*add\(7\)/);
  });

  it('does not let the learner contract skip its test', async () => {
    const result = await execute(request(vault, ['contract SkipTest is Test {\n    function test_x() public {\n        new Vault().skipMyTest();\n        assertTrue(false, "never reached");\n    }\n}']));
    expect(result.status).toBe('failed');
    expect(result.tests[0]?.stderr).toContain('FAIL: never reached');
  });

  it('reports a compile error in a test file', async () => {
    const result = await execute(request(vault, ['contract Broken is Test {\n    function test_x() public {\n        secretRule(41);\n    }\n}']));
    expect(result.status).toBe('compile_error');
    expect(result.compile?.stderr).toContain('Undeclared identifier');
  });
});
