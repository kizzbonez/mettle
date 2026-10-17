// The example from the instructions.
import { paginate, playableWith, Waitlist } from "./solution.js";

const games = [
  { title: "Carcassonne", minPlayers: 2, maxPlayers: 5 },
  { title: "Patchwork", minPlayers: 2, maxPlayers: 2 },
  { title: "Wingspan", minPlayers: 1, maxPlayers: 5 },
];
check.equal(
  playableWith(games, 4).map((game) => game.title),
  ["Carcassonne", "Wingspan"],
  "the titles of the games four people can play",
);
check.equal(paginate(games, 2, 2), { items: [games[2]], page: 2, totalPages: 2 }, "page 2 of the games, two per page");

const tables = new Waitlist();
check.equal(tables.add("Okafor"), 1, "the position of the first party added");
check.equal(tables.add("Lund"), 2, "the position of the second party added");
check.equal(tables.next(), "Okafor", "next() gives the first party in line");
check.equal(tables.size, 1, "the size after one party was called");

function typeChecksOnly(): void {
  // @ts-expect-error with no type argument, a waitlist holds strings
  tables.add(4);
}
check.true(typeof typeChecksOnly === "function", "a Waitlist with no type argument holds strings");
