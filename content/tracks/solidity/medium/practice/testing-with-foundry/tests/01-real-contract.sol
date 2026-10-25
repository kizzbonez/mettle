/// Runs your tests against the real TelescopeLoans: every one of them must pass.
/// A failing test shows its own message, as `forge test` would.
contract YourTestsOnTheRealContract is Test {
    TelescopeLoansTest suite;

    function setUp() public {
        vm.warp(1_000_000);
        suite = new TelescopeLoansTest();
        suite.setUp();
    }

    function test_your_stranger_test_passes() public {
        suite.test_stranger_cannot_give_back();
    }

    function test_your_non_member_test_passes() public {
        suite.test_non_member_cannot_borrow();
    }

    function test_your_due_second_test_passes() public {
        suite.test_return_at_the_due_second_is_free();
    }

    function testFuzz_your_fuzz_test_passes(uint256 lateBy) public {
        suite.testFuzz_refund_and_fee_add_up_to_the_deposit(lateBy);
    }
}
