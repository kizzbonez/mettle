contract ExampleTest is Test {
    MealCredits credits;
    CreditsHandler handler;

    function setUp() public {
        credits = new MealCredits();
        handler = new CreditsHandler(credits);
        targetContract(address(handler));
    }

    function test_example() public {
        address first = handler.actors(0);
        address second = handler.actors(1);
        handler.buy(3, 5); // actor 3 % 3 = 0 buys 5 credits
        handler.give(0, 1, 2); // actor 0 gives 2 to actor 1
        handler.redeem(1, 1); // actor 1 eats one meal
        handler.refund(0, 999); // actor 0 refunds what it has: 3 credits
        assertEq(credits.creditsOf(first), 0, "the first actor's credits");
        assertEq(credits.creditsOf(second), 1, "the second actor's credits");
        assertEq(handler.ghostBought(), 5, "ghostBought");
        assertEq(handler.ghostRedeemed(), 1, "ghostRedeemed");
        assertEq(handler.ghostRefunded(), 3, "ghostRefunded");
        assertEq(handler.sumOfCredits(), 1, "sumOfCredits");
    }

    function invariant_credits_add_up() public view {
        assertEq(credits.totalCredits(), handler.sumOfCredits(), "the total against the actors' credits");
    }
}
