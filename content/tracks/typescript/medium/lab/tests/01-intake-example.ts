// The example from the instructions: October's intake file, from loading to the parts quote.
import { costParts, countBy, describeOutcome, loadTickets, type PartsShop } from "./solution.js";

const { tickets, rejected } = await loadTickets("data/intake.json");

check.equal(
  tickets.map((ticket) => ticket.id),
  ["T-001", "T-002", "T-003", "T-005", "T-008", "T-009", "T-010", "T-011", "T-012"],
  "loadTickets keeps the valid tickets, in file order",
);
check.equal(
  rejected,
  [
    { index: 3, field: "category" },
    { index: 5, field: "owner" },
    { index: 6, field: "outcome" },
    { index: 8, field: "id" },
  ],
  "loadTickets reports each rejected entry by its index and the field at fault",
);
check.equal(
  tickets[1],
  {
    id: "T-002",
    owner: "Tom Becker",
    item: "Denim jacket",
    category: "textile",
    outcome: { status: "needs-part", part: "brass zip" },
  },
  "parseTicket trims the owner and keeps the outcome's fields",
);
check.equal(
  tickets[4].outcome,
  { status: "fixed", minutes: 10 },
  "parseTicket copies only the fields an outcome has, dropping extra ones such as note",
);

check.equal(
  tickets.slice(0, 4).map((ticket) => describeOutcome(ticket.outcome)),
  ["fixed in 25 min", "needs part: brass zip", "unrepairable: cracked base", "needs part: brake cable"],
  "describeOutcome describes each kind of outcome",
);
check.equal(describeOutcome({ status: "waiting" }), "waiting for a volunteer", "describeOutcome describes a waiting ticket");

check.equal(
  [...countBy(tickets, (ticket) => ticket.outcome.status)],
  [
    ["fixed", 3],
    ["needs-part", 4],
    ["unrepairable", 1],
    ["waiting", 1],
  ],
  "countBy counts the statuses, keys in the order they were first seen",
);

const stock: Record<string, number> = { "brass zip": 350, "brake cable": 600 };
const shop: PartsShop = {
  async priceOf(part: string): Promise<number> {
    if (Object.hasOwn(stock, part)) {
      return stock[part];
    }
    throw new Error(`not stocked: ${part}`);
  },
};
const quote = await costParts(tickets, shop);
check.equal(
  [...quote.prices],
  [
    ["brass zip", 350],
    ["brake cable", 600],
  ],
  "costParts maps each stocked part to its price, in order of first appearance",
);
check.equal(quote.unavailable, ["thermal fuse"], "costParts lists the parts the shop does not stock");
check.equal(quote.totalCents, 1550, "costParts adds up one price for every ticket that needs a stocked part");
