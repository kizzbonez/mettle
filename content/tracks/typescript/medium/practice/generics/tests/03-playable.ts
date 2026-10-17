// playableWith includes both ends of the range, keeps the order and the objects, and returns
// the caller's own type, not just the two fields it reads.
import { playableWith } from "./solution.js";

interface ShelfGame {
  title: string;
  minPlayers: number;
  maxPlayers: number;
  year: number;
}

const shelf: ShelfGame[] = [
  { title: "Azul", minPlayers: 2, maxPlayers: 4, year: 2017 },
  { title: "Codenames", minPlayers: 4, maxPlayers: 8, year: 2015 },
  { title: "Patchwork", minPlayers: 2, maxPlayers: 2, year: 2014 },
  { title: "Terraforming Mars", minPlayers: 1, maxPlayers: 5, year: 2016 },
];

const forTwo = playableWith(shelf, 2);
check.equal(forTwo.map((game) => game.title), ["Azul", "Patchwork", "Terraforming Mars"], "the games for two, in shelf order");
check.equal(playableWith(shelf, 4).map((game) => game.title), ["Azul", "Codenames", "Terraforming Mars"],
  "both minPlayers and maxPlayers are included");
check.equal(playableWith(shelf, 1).map((game) => game.title), ["Terraforming Mars"], "a solo game");
check.equal(playableWith(shelf, 9), [], "no game takes nine players");
check.equal(playableWith([], 3), [], "an empty shelf");
check.true(forTwo[0] === shelf[0], "the results are the shelf's own objects");

const years: number[] = forTwo.map((game) => game.year);
check.equal(years, [2017, 2014, 2016], "the results keep fields playableWith never reads");

const groups = [{ name: "book club", minPlayers: 3, maxPlayers: 6 }];
check.equal(playableWith(groups, 5)[0].name, "book club", "any object with the two numbers is accepted");

function typeChecksOnly(): void {
  // @ts-expect-error a game must have minPlayers and maxPlayers
  playableWith([{ title: "Chess" }], 2);
  // @ts-expect-error the players must be numbers
  playableWith([{ title: "Go", minPlayers: "2", maxPlayers: "2" }], 2);
  // @ts-expect-error a ShelfGame has no rating, and the result is still a ShelfGame
  playableWith(shelf, 2)[0].rating;
}
check.true(typeof typeChecksOnly === "function", "playableWith's constraint is checked by the compiler");
