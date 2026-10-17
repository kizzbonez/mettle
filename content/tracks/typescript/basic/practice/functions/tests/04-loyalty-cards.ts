import { makeLoyaltyCard } from "./solution.js";

const card: () => boolean = makeLoyaltyCard(5);
const freeOnes: number[] = [];
for (let iceCream = 1; iceCream <= 12; iceCream++) {
  if (card()) {
    freeOnes.push(iceCream);
  }
}
check.equal(freeOnes, [5, 10], "the ice creams that are free over twelve calls with freeEvery 5");

const ada = makeLoyaltyCard(2);
const bo = makeLoyaltyCard(2);
check.equal(ada(), false, "the first stamp on one card");
check.equal(ada(), true, "the second stamp on the same card");
check.equal(bo(), false, "the first stamp on a second card, which keeps its own count");
check.equal(ada(), false, "the third stamp on the first card");
check.equal(bo(), true, "the second stamp on the second card");

const everyTime = makeLoyaltyCard(1);
check.equal([everyTime(), everyTime(), everyTime()], [true, true, true], "a card with freeEvery 1 makes every ice cream free");
