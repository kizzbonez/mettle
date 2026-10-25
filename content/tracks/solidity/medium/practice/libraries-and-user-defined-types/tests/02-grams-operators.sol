/// Calls the operators from outside, so that a revert inside one can be expected.
contract GramsOperatorHarness {
    function minus(Grams a, Grams b) external pure returns (Grams) {
        return a - b;
    }
}

contract GramsOperatorsTest is Test {
    function test_subtracts() public pure {
        Grams left = Grams.wrap(1_200) - Grams.wrap(450);
        assertEq(Grams.unwrap(left), 750, "1,200 g minus 450 g");
        assertEq(Grams.unwrap(Grams.wrap(9) - Grams.wrap(9)), 0, "a weight minus itself");
    }

    function test_subtracting_too_much_panics() public {
        GramsOperatorHarness harness = new GramsOperatorHarness();
        vm.expectRevert(stdError.arithmeticError);
        harness.minus(Grams.wrap(100), Grams.wrap(101));
    }

    function test_equality() public pure {
        assertTrue(Grams.wrap(250) == Grams.wrap(250), "two equal weights compare equal");
        assertFalse(Grams.wrap(250) == Grams.wrap(251), "a heavier weight is not equal");
        assertFalse(Grams.wrap(251) == Grams.wrap(250), "a lighter weight is not equal");
        assertTrue(Grams.wrap(0) == Grams.wrap(0), "zero equals zero");
    }

    function testFuzz_adding_then_subtracting_returns_the_start(uint128 a, uint128 b) public pure {
        Grams start = Grams.wrap(a);
        Grams back = (start + Grams.wrap(b)) - Grams.wrap(b);
        assertTrue(back == start, "adding then subtracting the same weight changes nothing");
    }
}
