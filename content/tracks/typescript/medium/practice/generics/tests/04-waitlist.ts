// Waitlist<T> serves first come, first served, keeps its entries private, and holds only
// entries of its type.
import { Waitlist } from "./solution.js";

interface Party {
  name: string;
  people: number;
}

const evening = new Waitlist<Party>();
check.equal(evening.size, 0, "a new waitlist is empty");
check.equal(evening.next(), undefined, "next() on an empty waitlist");
check.equal(evening.peek(), undefined, "peek() on an empty waitlist");

const okafor = { name: "Okafor", people: 4 };
check.equal(evening.add(okafor), 1, "the first party is first in line");
check.equal(evening.add({ name: "Lund", people: 2 }), 2, "the second party is second");
check.equal(evening.add({ name: "Silva", people: 6 }), 3, "the third party is third");
check.true(evening.peek() === okafor, "peek() returns the first party itself");
check.equal(evening.size, 3, "peek() removes nothing");

const called = evening.next();
check.equal(called?.people, 4, "next() returns the first party, typed as a Party");
check.equal(evening.add({ name: "Chen", people: 3 }), 3, "a party added after one was called gets its place in the current line");
check.equal(
  [evening.next()?.name, evening.next()?.name, evening.next()?.name, evening.next()],
  ["Lund", "Silva", "Chen", undefined],
  "parties are called in the order they were added, then the list is empty",
);
check.equal(evening.size, 0, "the size after everyone was called");

const lunch = new Waitlist<number>();
lunch.add(12);
check.equal([lunch.size, evening.size], [1, 0], "every waitlist keeps its own entries");
check.equal(Object.keys(lunch), [], "the entries are kept in a #private field");

function typeChecksOnly(): void {
  // @ts-expect-error a Waitlist<number> takes only numbers
  lunch.add("12");
  // @ts-expect-error the waitlist may be empty, so next() may give undefined
  const first: Party = evening.next();
  // @ts-expect-error size is a getter, so it cannot be assigned
  evening.size = 10;
}
check.true(typeof typeChecksOnly === "function", "Waitlist's types are checked by the compiler");
