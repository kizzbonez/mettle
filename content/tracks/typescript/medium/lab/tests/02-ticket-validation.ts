// parseTicket validates one entry, reports the first field at fault, and builds a clean ticket.
import { parseTicket, TicketError } from "./solution.js";

function fieldOf(value: unknown, what: string): string {
  const error = check.throws(() => parseTicket(value), `parseTicket rejects ${what}`, TicketError);
  return (error as TicketError).field;
}

const good = {
  id: "T-042",
  owner: "  Ines Duarte  ",
  item: " Sewing machine ",
  category: "textile",
  outcome: { status: "unrepairable", reason: "  motor burnt out " },
};
check.equal(
  parseTicket(good),
  {
    id: "T-042",
    owner: "Ines Duarte",
    item: "Sewing machine",
    category: "textile",
    outcome: { status: "unrepairable", reason: "motor burnt out" },
  },
  "parseTicket trims owner, item and the reason of an unrepairable outcome",
);
check.true(parseTicket(good) !== parseTicket(good), "parseTicket builds a new object on every call");
check.equal(
  parseTicket({ ...good, extra: true, outcome: { status: "waiting", minutes: 5, part: "x" } }),
  { id: "T-042", owner: "Ines Duarte", item: "Sewing machine", category: "textile", outcome: { status: "waiting" } },
  "parseTicket ignores fields a ticket or outcome does not have",
);
check.equal(
  parseTicket({ ...good, outcome: { status: "fixed", minutes: 1 } }).outcome,
  { status: "fixed", minutes: 1 },
  "one minute is a valid repair time",
);
check.equal(
  parseTicket({ ...good, outcome: { status: "needs-part", part: " gear cog " } }).outcome,
  { status: "needs-part", part: "gear cog" },
  "parseTicket trims the part of a needs-part outcome",
);

check.equal(fieldOf(null, "null"), "ticket", "null is reported as the ticket field");
check.equal(fieldOf([good], "an array"), "ticket", "an array is reported as the ticket field");
check.equal(fieldOf("T-042", "a string"), "ticket", "a string is reported as the ticket field");

check.equal(fieldOf({ ...good, id: "T-42" }, "an id with two digits"), "id", "a short id is reported as the id field");
check.equal(fieldOf({ ...good, id: "t-042" }, "a lowercase id"), "id", "a lowercase id is reported as the id field");
check.equal(fieldOf({ ...good, id: " T-042" }, "an id with a space"), "id", "an id is not trimmed");
check.equal(fieldOf({ ...good, id: 42 }, "a numeric id"), "id", "a numeric id is reported as the id field");

check.equal(fieldOf({ ...good, owner: "   " }, "a blank owner"), "owner", "a blank owner is reported as the owner field");
check.equal(fieldOf({ ...good, owner: undefined }, "a missing owner"), "owner", "a missing owner is reported");
check.equal(fieldOf({ ...good, item: 7 }, "a numeric item"), "item", "a numeric item is reported as the item field");
check.equal(fieldOf({ ...good, category: "Textile" }, "a capitalized category"), "category", "categories match exactly");
check.equal(fieldOf({ ...good, category: "toString" }, "an inherited name as category"), "category",
  "only the four listed categories are accepted");

check.equal(fieldOf({ ...good, outcome: undefined }, "a missing outcome"), "outcome", "a missing outcome is reported");
check.equal(fieldOf({ ...good, outcome: "fixed" }, "an outcome that is a string"), "outcome",
  "an outcome must be an object");
check.equal(fieldOf({ ...good, outcome: { status: "lost" } }, "an unknown status"), "outcome",
  "an unknown status is reported as the outcome field");
check.equal(fieldOf({ ...good, outcome: { status: "fixed" } }, "a fixed outcome without minutes"), "outcome",
  "a fixed outcome needs minutes");
check.equal(fieldOf({ ...good, outcome: { status: "fixed", minutes: 0 } }, "zero minutes"), "outcome",
  "minutes must be at least 1");
check.equal(fieldOf({ ...good, outcome: { status: "fixed", minutes: 12.5 } }, "fractional minutes"), "outcome",
  "minutes must be a whole number");
check.equal(fieldOf({ ...good, outcome: { status: "fixed", minutes: "20" } }, "minutes as text"), "outcome",
  "minutes must be a number, not text");
check.equal(fieldOf({ ...good, outcome: { status: "needs-part", part: " " } }, "a blank part"), "outcome",
  "a needs-part outcome needs a part");
check.equal(fieldOf({ ...good, outcome: { status: "unrepairable" } }, "a missing reason"), "outcome",
  "an unrepairable outcome needs a reason");

check.equal(
  fieldOf({ id: "bad", owner: "", item: "", category: "garden" }, "an entry with several problems"),
  "id",
  "the first field at fault, in the order id, owner, item, category, outcome, is reported",
);
check.equal(
  fieldOf({ ...good, item: "", category: "garden" }, "a blank item and a bad category"),
  "item",
  "item is checked before category",
);
const error = check.throws(() => parseTicket({ ...good, category: "garden" }), "parseTicket rejects a bad category", TicketError);
check.true(error.message.length > 0, "a TicketError carries a message");
