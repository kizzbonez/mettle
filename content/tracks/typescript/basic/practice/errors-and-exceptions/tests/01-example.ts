import { bookSeats, parseSeat, SeatError } from "./solution.js";

// The example from the instructions.
check.equal(parseSeat("C-12"), { row: "C", number: 12 }, 'parseSeat("C-12")');
check.equal(parseSeat(" b-3 "), { row: "B", number: 3 }, 'parseSeat(" b-3 ")');

const typo = check.throws(() => parseSeat("C12"), 'parseSeat("C12") throws a SeatError', SeatError);
check.equal(typo.message, '"C12" is not a seat code', 'the message of the SeatError from parseSeat("C12")');
check.true(typo instanceof SeatError && typo.code === "C12", 'the code kept by the SeatError from parseSeat("C12")');

const missing = check.throws(() => parseSeat("K-5"), 'parseSeat("K-5") throws a RangeError', RangeError);
check.equal(missing.message, "there is no seat K-5", 'the message of the RangeError from parseSeat("K-5")');

check.equal(
  bookSeats(["C-12", "C12", "K-5", "d-7"]),
  ["booked C-12", 'ask again: "C12" is not a seat code', "refused: there is no seat K-5", "booked D-7"],
  'bookSeats(["C-12", "C12", "K-5", "d-7"])',
);
