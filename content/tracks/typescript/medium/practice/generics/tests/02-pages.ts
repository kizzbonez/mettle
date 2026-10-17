// paginate counts pages from 1, handles short and empty pages, and keeps the item type.
import { paginate, type Page } from "./solution.js";

const letters = ["a", "b", "c", "d", "e", "f", "g"];
const snapshot = [...letters];
check.equal(paginate(letters, 3, 1), { items: ["a", "b", "c"], page: 1, totalPages: 3 }, "the first page of three");
check.equal(paginate(letters, 3, 3), { items: ["g"], page: 3, totalPages: 3 }, "a last page that is not full");
check.equal(paginate(letters, 3, 4), { items: [], page: 4, totalPages: 3 }, "a page past the end has no items");
check.equal(paginate(letters, 10, 1), { items: letters, page: 1, totalPages: 1 }, "one page holds everything when perPage is large");
check.equal(paginate([], 5, 1), { items: [], page: 1, totalPages: 0 }, "an empty list has no pages");
check.equal(paginate(letters, 1, 7).items, ["g"], "one item per page");
check.equal(letters, snapshot, "paginate does not change the array it is given");
check.true(paginate(letters, 10, 1).items !== letters, "a page holds a new array, not the caller's array");

const prices: Page<number> = paginate([4.5, 3, 6, 2.25], 2, 2);
check.equal(prices.items.reduce((sum, price) => sum + price, 0), 8.25, "a page of numbers can be added up");

function typeChecksOnly(): void {
  // @ts-expect-error a page of strings holds strings, not numbers
  const wrong: number[] = paginate(letters, 3, 1).items;
  // @ts-expect-error a Page<number> holds numbers
  const mixed: Page<number> = { items: ["4.5"], page: 1, totalPages: 1 };
}
check.true(typeof typeChecksOnly === "function", "paginate and Page keep the type of their items");
