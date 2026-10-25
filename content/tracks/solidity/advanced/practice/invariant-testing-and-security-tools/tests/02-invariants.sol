contract MealInvariantsTest is Test {
    MealCredits credits;
    CreditsHandler handler;

    function setUp() public {
        credits = new MealCredits();
        handler = new CreditsHandler(credits);
        targetContract(address(handler));
    }

    function invariant_the_total_matches_the_ghosts() public view {
        assertEq(
            credits.totalCredits(),
            handler.ghostBought() - handler.ghostRedeemed() - handler.ghostRefunded(),
            "the total credits against the handler's ghosts"
        );
    }

    function invariant_kitchen_earnings_match_the_meals() public view {
        assertEq(
            credits.kitchenEarnings(),
            handler.ghostRedeemed() * credits.PRICE(),
            "the kitchen's earnings against the meals redeemed"
        );
    }

    function invariant_the_ether_is_backed() public view {
        assertEq(
            address(credits).balance,
            credits.totalCredits() * credits.PRICE() + credits.kitchenEarnings(),
            "the ether held against the credits and earnings"
        );
    }

    function invariant_the_actors_hold_every_credit() public view {
        assertEq(handler.sumOfCredits(), credits.totalCredits(), "the actors' credits against the total");
    }
}
