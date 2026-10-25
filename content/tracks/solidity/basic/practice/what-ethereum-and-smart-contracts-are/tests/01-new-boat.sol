// Deploys your contract on the local test chain, sells three places and
// checks what the contract reports before and after.
contract NewBoatTest is Test {
    function test_sells_places_on_the_new_boat() public {
        LanternCruise cruise = new LanternCruise();
        assertEq(cruise.SEATS(), 40, "the number of seats on the new boat");
        assertEq(cruise.seatsLeft(), 40, "seats left before any place is sold");

        cruise.book(3);
        console.log("sold after booking 3 places:", cruise.sold());
        console.log("seats left:", cruise.seatsLeft());
        assertEq(cruise.sold(), 3, "places sold after booking 3");
        assertEq(cruise.seatsLeft(), 37, "seats left after booking 3");
    }
}
