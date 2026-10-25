/**
 * Files the Solidity harness writes next to the learner's `src/solution.sol`: the Foundry project
 * settings, the header every test file starts with, and the jq filters that turn forge's JSON
 * results into what the learner reads and into the verdict.
 */

/**
 * Offline, with the pinned compiler and the libraries in the image. A fixed fuzz seed makes fuzz
 * and invariant tests reproducible; the linter and dynamic test linking would only add noise to
 * a learner's build output. Contracts may read fixtures in data/ and nothing else. Foundry hides
 * solc's warning that `send` and `transfer` are deprecated; a learner should see it.
 */
export const FOUNDRY_TOML = `[profile.default]
src = "src"
test = "test"
out = "out"
cache_path = "cache"
libs = ["/opt/sol-libs"]
remappings = [
  "forge-std/=/opt/sol-libs/forge-std/src/",
  "@openzeppelin/contracts/=/opt/sol-libs/openzeppelin-contracts/contracts/",
]
allow_paths = ["/opt/sol-libs"]
solc = "/opt/solc/solc-0.8.38"
offline = true
auto_detect_solc = false
dynamic_test_linking = false
ffi = false
fs_permissions = [{ access = "read", path = "./data" }]
ignored_error_codes = ["license", "code-size", "init-code-size", "transient-storage"]

[fuzz]
seed = "0x1"
runs = 256

[invariant]
runs = 64
depth = 32

[lint]
lint_on_build = false
`;

/**
 * Put on the first line of every test file, before the author's own first line, so line numbers
 * in messages are the test file's own. The license comment is a block comment for that reason.
 */
export const TEST_HEADER =
  '/* SPDX-License-Identifier: UNLICENSED */ pragma solidity ^0.8.24; ' +
  'import {Test, Vm, console, stdError, StdInvariant} from "forge-std/Test.sol"; import "../src/solution.sol"; ';

/** One line per test function, its logs and any fuzz counterexample: what a visible test shows. */
export const REPORT_JQ = `to_entries[] | .value.test_results | to_entries[] |
  (if .value.status == "Success" then "[PASS] " else "[FAIL] " end) + .key
    + (if .value.reason then ": " + .value.reason else "" end),
  (.value.decoded_logs[]? | "    " + .),
  (.value.counterexample // empty | .. | objects | select(has("args")) | "    counterexample: args=[" + .args + "]")
`;

/** "FAIL: reason" for each failed test function: the first line is a hidden test's reason. */
export const FAILURES_JQ = `to_entries[] | .value.test_results | to_entries[] | select(.value.status != "Success") |
  "FAIL: " + (.value.reason // (if .value.status == "Skipped" then "the test was skipped" else "the test failed" end)),
  "  in " + .key
`;

/** Passed: at least one test function ran, and every one succeeded (a skipped one does not count). */
export const PASSED_JQ = '[.[].test_results[]] | length > 0 and all(.status == "Success")';
