import { bookSeats } from "./solution.js";

check.equal(bookSeats([]), [], "an order with no seats");
check.equal(bookSeats(["E-4", "E-5", "E-6"]), ["booked E-4", "booked E-5", "booked E-6"], "an order where every seat is read");
check.equal(
  bookSeats(["E4", "Z-1"]),
  ['ask again: "E4" is not a seat code', "refused: there is no seat Z-1"],
  "an order where no seat can be read",
);
check.equal(
  bookSeats(["G-0", "g-1", "G-1-2", "g-2"]),
  ["refused: there is no seat G-0", "booked G-1", 'ask again: "G-1-2" is not a seat code', "booked G-2"],
  "a bad code in the middle does not stop the codes after it",
);
