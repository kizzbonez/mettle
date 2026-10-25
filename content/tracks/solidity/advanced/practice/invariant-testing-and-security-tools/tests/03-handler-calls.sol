contract HandlerCallsTest is Test {
    MealCredits credits;
    CreditsHandler handler;
    address a0;
    address a1;
    address a2;

    function setUp() public {
        credits = new MealCredits();
        handler = new CreditsHandler(credits);
        (a0, a1, a2) = (handler.actors(0), handler.actors(1), handler.actors(2));
    }

    function test_wild_inputs_are_bounded_not_reverted() public {
        handler.buy(5, type(uint256).max);
        uint256 bought = handler.ghostBought();
        assertLe(bought, 20, "the credits one buy may add");
        assertEq(credits.creditsOf(a2), bought, "the credits actor 5 % 3 bought");

        handler.give(2, 0, type(uint256).max);
        assertEq(credits.creditsOf(a0), bought, "the credits actor 0 received from a gift of everything");
        handler.redeem(3, type(uint256).max);
        assertEq(handler.ghostRedeemed(), bought, "ghostRedeemed after redeeming everything");
        assertEq(credits.creditsOf(a0), 0, "actor 0's credits after redeeming everything");
    }

    function test_actors_with_nothing_do_not_revert() public {
        handler.give(0, 1, 7);
        handler.redeem(1, 7);
        handler.refund(2, 7);
        assertEq(handler.ghostRedeemed() + handler.ghostRefunded(), 0, "the ghosts after calls by empty actors");
    }

    function test_a_gift_to_oneself_goes_through() public {
        handler.buy(1, 10);
        handler.give(1, 4, 3); // 1 % 3 and 4 % 3 are the same actor
        assertEq(credits.creditsOf(a1), 10, "the credits after a gift to oneself");
        assertEq(handler.sumOfCredits(), 10, "sumOfCredits after a gift to oneself");
    }

    function test_refunds_pay_the_actor_and_count() public {
        handler.buy(2, 6);
        uint256 before = a2.balance;
        handler.refund(2, 4);
        assertEq(handler.ghostRefunded(), 4, "ghostRefunded after a refund of 4");
        assertEq(a2.balance - before, 4 * credits.PRICE(), "the ether a refund of 4 paid the actor");
        assertEq(credits.creditsOf(address(handler)), 0, "the credits held by the handler itself");
    }

    function test_the_sum_covers_all_three_actors() public {
        handler.buy(0, 1);
        handler.buy(1, 2);
        handler.buy(2, 3);
        assertEq(handler.sumOfCredits(), 6, "sumOfCredits with credits spread over three actors");
    }
}
