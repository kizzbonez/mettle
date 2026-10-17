import { createLruCache } from "./solution.js";

// The rules, on a small cache.
const shelf = createLruCache<number>(3);
check.equal(shelf.size, 0, "a new cache is empty");
check.equal(shelf.get("a"), undefined, "a miss on an empty cache");
shelf.set("a", 1);
shelf.set("b", 2);
shelf.set("c", 3);
check.equal(shelf.keys(), ["a", "b", "c"], "keys from least to most recently used");
shelf.set("a", 10);
check.equal(shelf.keys(), ["b", "c", "a"], "replacing a value makes the key the most recently used");
check.equal(shelf.size, 3, "replacing does not add an entry");
check.equal(shelf.get("a"), 10, "the replaced value");
check.equal(shelf.get("b"), 2, "a hit");
check.equal(shelf.keys(), ["c", "a", "b"], "a hit makes the key the most recently used");
check.equal(shelf.get("zzz"), undefined, "a miss");
check.equal(shelf.keys(), ["c", "a", "b"], "a miss changes nothing");
shelf.set("d", 4);
check.equal(shelf.keys(), ["a", "b", "d"], "the least recently used key is dropped");
check.equal(shelf.get("c"), undefined, "the dropped key is gone");

const single = createLruCache<string>(1);
single.set("x", "one");
single.set("y", "two");
check.equal([single.size, single.keys(), single.get("y")], [1, ["y"], "two"], "a cache of one entry");

// Work counted: a lookup that only loads what is not cached.
let loads = 0;
const covers = createLruCache<string>(2);
function cover(isbn: string): string {
  const cached = covers.get(isbn);
  if (cached !== undefined) return cached;
  loads += 1;
  const image = `cover of ${isbn}`;
  covers.set(isbn, image);
  return image;
}
for (const isbn of ["1", "2", "1", "3", "1", "2", "2", "3"]) cover(isbn);
check.equal(loads, 5, "the number of loads a two-entry cache leaves to do for eight lookups");

// The pattern that leaked: lookups by request ids that never repeat. Three rounds of 20,000;
// the cache must hold exactly its limit after each round instead of growing.
const limit = 1000;
const quotes = createLruCache<number>(limit);
const sizes: number[] = [];
let id = 0;
for (let round = 0; round < 3; round++) {
  for (let i = 0; i < 20_000; i++) {
    id += 1;
    if (quotes.get(`req-${id}`) === undefined) quotes.set(`req-${id}`, id);
  }
  sizes.push(quotes.size);
}
check.equal(sizes, [limit, limit, limit], "the cache size after each of three rounds of 20,000 new keys");
check.equal(quotes.keys().length, limit, "keys() lists every cached entry");
check.equal(quotes.keys()[0], `req-${id - limit + 1}`, "the oldest key kept is the 1000th newest");
check.equal(quotes.get(`req-${id}`), id, "the newest entry is cached");
check.equal(quotes.get("req-1"), undefined, "an entry from the first round is long gone");
