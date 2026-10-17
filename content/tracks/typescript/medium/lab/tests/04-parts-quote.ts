// costParts asks a slow, sometimes failing shop for prices: once per part, all at once, and
// without letting one failure spoil the quote.
import { costParts, type Outcome, type PartsShop, type Ticket } from "./solution.js";

function ticket(id: string, outcome: Outcome): Ticket {
  return { id, owner: "Visitor", item: "Thing", category: "electrical", outcome };
}

function part(name: string): Outcome {
  return { status: "needs-part", part: name };
}

interface FakeShop {
  shop: PartsShop;
  asked: string[];
  mostAtOnce: () => number;
}

// Answers after a delay that depends on the part, so answers arrive in a different order from
// the questions. Parts missing from the price list are rejected.
function fakeShop(prices: Record<string, number>): FakeShop {
  const asked: string[] = [];
  let open = 0;
  let most = 0;
  const shop: PartsShop = {
    async priceOf(name: string): Promise<number> {
      asked.push(name);
      open += 1;
      most = Math.max(most, open);
      await new Promise((resolve) => setTimeout(resolve, 5 + name.length * 3));
      open -= 1;
      if (!Object.hasOwn(prices, name)) {
        throw new Error(`the shop does not stock ${name}`);
      }
      return prices[name];
    },
  };
  return { shop, asked, mostAtOnce: () => most };
}

const tickets = [
  ticket("T-001", part("thermal fuse")),
  ticket("T-002", { status: "fixed", minutes: 20 }),
  ticket("T-003", part("brake cable")),
  ticket("T-004", part("bobbin case")),
  ticket("T-005", part("thermal fuse")),
  ticket("T-006", { status: "waiting" }),
  ticket("T-007", part("zip")),
  ticket("T-008", part("brake cable")),
  ticket("T-009", part("thermal fuse")),
];

const first = fakeShop({ "thermal fuse": 250, zip: 120, "brake cable": 600 });
const quote = await costParts(tickets, first.shop);
check.equal(
  [...first.asked].sort(),
  ["bobbin case", "brake cable", "thermal fuse", "zip"],
  "costParts asks the shop about each distinct part exactly once",
);
check.true(first.mostAtOnce() === 4, "costParts sends all its questions before waiting for any answer");
check.equal(
  [...quote.prices],
  [
    ["thermal fuse", 250],
    ["brake cable", 600],
    ["zip", 120],
  ],
  "prices follow the order in which parts first appear among the tickets, not the order answers arrive",
);
check.equal(quote.unavailable, ["bobbin case"], "a part the shop rejects is listed as unavailable");
check.equal(quote.totalCents, 3 * 250 + 2 * 600 + 120, "the total counts the price once for every ticket needing that part");

const none = fakeShop({});
const noParts = await costParts([ticket("T-010", { status: "fixed", minutes: 5 })], none.shop);
check.equal(none.asked, [], "costParts does not call the shop when no ticket needs a part");
check.equal(
  { prices: [...noParts.prices], unavailable: noParts.unavailable, totalCents: noParts.totalCents },
  { prices: [], unavailable: [], totalCents: 0 },
  "a quote without parts is empty and totals 0",
);

const closed = fakeShop({});
const allMissing = await costParts(tickets, closed.shop);
check.equal(
  allMissing.unavailable,
  ["thermal fuse", "brake cable", "bobbin case", "zip"],
  "when every request fails, costParts still resolves and lists every part as unavailable, in order of first appearance",
);
check.equal(allMissing.prices.size + allMissing.totalCents, 0, "with nothing in stock there are no prices and the total is 0");

const empty = await costParts([], fakeShop({ zip: 1 }).shop);
check.equal(empty.totalCents, 0, "an empty list of tickets costs nothing");
