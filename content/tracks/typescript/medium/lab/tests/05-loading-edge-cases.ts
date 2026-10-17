// loadTickets survives odd entries one by one, but refuses files that are not a list of tickets.
import { loadTickets, TicketError } from "./solution.js";

const odd = await loadTickets("data/odd-entries.json");
check.equal(
  odd.rejected,
  [
    { index: 0, field: "ticket" },
    { index: 1, field: "ticket" },
    { index: 2, field: "ticket" },
    { index: 3, field: "id" },
    { index: 4, field: "item" },
    { index: 5, field: "category" },
    { index: 6, field: "outcome" },
    { index: 7, field: "outcome" },
    { index: 9, field: "id" },
  ],
  "loadTickets rejects null, text, nested arrays and each field problem, and a repeated id",
);
check.equal(
  odd.tickets,
  [
    {
      id: "T-008",
      owner: "Rita Costa",
      item: "Radio",
      category: "electrical",
      outcome: { status: "needs-part", part: "tuning knob" },
    },
  ],
  "loadTickets keeps the one valid entry, cleaned by parseTicket, and the first of two entries with one id",
);

const notList = await check.rejects(
  () => loadTickets("data/not-a-list.json"),
  "loadTickets rejects a file whose JSON is not an array",
  TicketError,
);
check.equal((notList as TicketError).field, "tickets", "a file that is not an array is reported as the tickets field");

await check.rejects(
  () => loadTickets("data/broken.json"),
  "loadTickets rejects with the SyntaxError from JSON.parse when the file is not valid JSON",
  SyntaxError,
);

const missing = await check.rejects(
  () => loadTickets("data/no-such-file.json"),
  "loadTickets rejects when the file does not exist",
);
check.true(!(missing instanceof TicketError) && "code" in missing && missing.code === "ENOENT",
  "a missing file rejects with Node's own ENOENT error, not a TicketError");

const again = await loadTickets("data/intake.json");
check.true(again.tickets.length === 9 && again.rejected.length === 4,
  "loading the same file twice gives the same result (no state is kept between calls)");
