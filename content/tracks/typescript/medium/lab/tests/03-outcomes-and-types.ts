// The Outcome union, countBy's generic signature and TicketUpdate are checked by the compiler:
// each @ts-expect-error line must be rejected by your types, and the other lines accepted.
import {
  applyUpdate,
  countBy,
  describeOutcome,
  type Category,
  type Outcome,
  type Ticket,
  type TicketUpdate,
} from "./solution.js";

const fixed: Outcome = { status: "fixed", minutes: 25 };
const needsPart: Outcome = { status: "needs-part", part: "heating element" };
const unrepairable: Outcome = { status: "unrepairable", reason: "cracked casing" };
const waiting: Outcome = { status: "waiting" };
const statuses: Outcome["status"][] = ["waiting", "fixed", "needs-part", "unrepairable"];
// @ts-expect-error a fixed outcome must say how many minutes the repair took
const noMinutes: Outcome = { status: "fixed" };
// @ts-expect-error minutes are a number
const minutesAsText: Outcome = { status: "fixed", minutes: "25" };
// @ts-expect-error a needs-part outcome must name the part
const noPart: Outcome = { status: "needs-part" };
// @ts-expect-error "lost" is not one of the four statuses
const lostStatus: Outcome["status"] = "lost";
// @ts-expect-error a waiting outcome has no part
const waitingWithPart: Outcome = { status: "waiting", part: "fuse" };

function minutesOf(outcome: Outcome): number {
  if (outcome.status === "fixed") {
    return outcome.minutes;
  }
  // @ts-expect-error only a fixed outcome has minutes
  return outcome.minutes;
}

check.equal(describeOutcome(fixed), "fixed in 25 min", "describeOutcome describes a fixed outcome");
check.equal(describeOutcome(needsPart), "needs part: heating element", "describeOutcome describes a needs-part outcome");
check.equal(describeOutcome(unrepairable), "unrepairable: cracked casing",
  "describeOutcome describes an unrepairable outcome");
check.equal(describeOutcome(waiting), "waiting for a volunteer", "describeOutcome describes a waiting outcome");
check.throws(() => describeOutcome({ status: "lost" } as unknown as Outcome),
  "describeOutcome throws for a status outside the union instead of returning a description");
check.equal(minutesOf(fixed) + statuses.length, 29, "a fixed outcome keeps its minutes");

const tickets: Ticket[] = [
  { id: "T-001", owner: "Priya", item: "Toaster", category: "electrical", outcome: waiting },
  { id: "T-002", owner: "Tom", item: "Jacket", category: "textile", outcome: needsPart },
  { id: "T-003", owner: "Ana", item: "Lamp", category: "electrical", outcome: fixed },
  { id: "T-004", owner: "Sam", item: "Bike", category: "bicycle", outcome: needsPart },
];

const byStatus: Map<Outcome["status"], number> = countBy(tickets, (ticket) => ticket.outcome.status);
const byCategory: Map<Category, number> = countBy(tickets, (ticket) => ticket.category);
// @ts-expect-error countBy only accepts key functions that return strings
countBy(tickets, (ticket) => ticket.id.length);

check.equal([...byStatus], [["waiting", 1], ["needs-part", 2], ["fixed", 1]], "countBy counts statuses in first-seen order");
check.equal([...byCategory], [["electrical", 2], ["textile", 1], ["bicycle", 1]], "countBy counts categories in first-seen order");
check.equal([...countBy(["b", "a", "b", "c", "b"], (letter) => letter)], [["b", 3], ["a", 1], ["c", 1]],
  "countBy works for any item type");
check.equal(countBy([], (item: string) => item).size, 0, "countBy of an empty list is an empty map");

const update: TicketUpdate = { owner: "Priya Nair", outcome: { status: "fixed", minutes: 15 } };
const empty: TicketUpdate = {};
// @ts-expect-error a ticket's id cannot be changed by an update
const idUpdate: TicketUpdate = { id: "T-999" };
// @ts-expect-error a ticket's category cannot be changed by an update
const categoryUpdate: TicketUpdate = { category: "textile" };

const original = tickets[0];
const before = structuredClone(original);
const updated = applyUpdate(original, update);
check.equal(
  updated,
  { id: "T-001", owner: "Priya Nair", item: "Toaster", category: "electrical", outcome: { status: "fixed", minutes: 15 } },
  "applyUpdate replaces the fields the update gives and keeps the rest",
);
check.equal(original, before, "applyUpdate leaves the original ticket unchanged");
check.true(updated !== original, "applyUpdate returns a new ticket");
check.equal(applyUpdate(original, empty), before, "an empty update gives an equal copy");
