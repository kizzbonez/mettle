import { makeLoyaltyCard, orderLine, priceWithOffer, totalCents } from "./solution.js";

// The examples from the instructions.
check.equal(orderLine("mango"), "1 x mango", 'orderLine("mango")');
check.equal(orderLine("mango", 2), "2 x mango", 'orderLine("mango", 2)');
check.equal(orderLine("pistachio", 3, "sprinkles"), "3 x pistachio with sprinkles", 'orderLine("pistachio", 3, "sprinkles")');
check.equal(totalCents(250, 300, 175), 725, "totalCents(250, 300, 175)");
check.equal(totalCents(), 0, "totalCents()");
check.equal(priceWithOffer(350, (cents) => cents - 100), 250, "priceWithOffer(350, (cents) => cents - 100)");
check.equal(priceWithOffer(325, (cents) => cents / 2), 163, "priceWithOffer(325, (cents) => cents / 2)");
check.equal(priceWithOffer(80, (cents) => cents - 100), 0, "priceWithOffer(80, (cents) => cents - 100)");

const card = makeLoyaltyCard(3);
check.equal([card(), card(), card(), card()], [false, false, true, false], "four calls of makeLoyaltyCard(3)'s card");
