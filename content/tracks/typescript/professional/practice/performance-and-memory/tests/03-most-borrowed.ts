import { mostBorrowed } from "./solution.js";

// Small lists.
check.equal(mostBorrowed(["Emma"]), "Emma", "a single loan");
check.equal(mostBorrowed(["Kim", "Emma", "Emma"]), "Emma", "a clear winner that is not first");
check.equal(mostBorrowed(["Kim", "Emma", "Dune"]), "Kim", "all tied: the first title");
check.equal(mostBorrowed(["Dune", "Emma", "Emma", "Dune", "Kim", "Kim", "Kim"]), "Kim", "the winner appears last");
check.equal(mostBorrowed(["emma", "Emma", "Emma"]), "Emma", "titles are compared exactly");
check.equal(mostBorrowed(["", "", "Kim"]), "", "an empty title counts like any other");

// A year of loans: 400,000 loans of 50,000 titles, each borrowed 8 times, plus two extra loans
// for two titles, which tie at 9. Counting each title with its own pass would take hours.
const titles: string[] = [];
for (let i = 0; i < 400_000; i++) titles.push(`title-${(i * 7919) % 50_000}`);
titles.push("title-49999", "title-123");
const expected = titles.indexOf("title-49999") < titles.indexOf("title-123") ? "title-49999" : "title-123";
check.equal(mostBorrowed(titles), expected, "the most borrowed of 400,000 loans, with a tie");

// One clear winner hidden at the end of a long list.
const year = Array.from({ length: 300_000 }, (_, i) => `book-${i % 100_000}`);
for (let i = 0; i < 4; i++) year.push("book-77777");
check.equal(mostBorrowed(year), "book-77777", "a title borrowed four more times at the end of 300,000 loans");
