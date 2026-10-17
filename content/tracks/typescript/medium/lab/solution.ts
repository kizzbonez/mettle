import { readFile } from "node:fs/promises";

export const CATEGORIES = ["electrical", "textile", "bicycle", "furniture"] as const;
export type Category = (typeof CATEGORIES)[number];

export type Outcome =
  | { status: "waiting" }
  | { status: "fixed"; minutes: number }
  | { status: "needs-part"; part: string }
  | { status: "unrepairable"; reason: string };

export interface Ticket {
  id: string;
  owner: string;
  item: string;
  category: Category;
  outcome: Outcome;
}

export type TicketUpdate = Partial<Pick<Ticket, "owner" | "item" | "outcome">>;

export interface Rejection {
  index: number;
  field: string;
}

export interface LoadResult {
  tickets: Ticket[];
  rejected: Rejection[];
}

export interface PartsShop {
  priceOf(part: string): Promise<number>;
}

export interface PartsQuote {
  prices: Map<string, number>;
  unavailable: string[];
  totalCents: number;
}

export class TicketError extends Error {
  readonly field: string;

  constructor(field: string, message: string) {
    super(message);
    this.name = "TicketError";
    this.field = field;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isCategory(value: unknown): value is Category {
  return typeof value === "string" && (CATEGORIES as readonly string[]).includes(value);
}

function filledText(value: unknown): string | undefined {
  if (typeof value !== "string" || value.trim() === "") {
    return undefined;
  }
  return value.trim();
}

function parseOutcome(value: unknown): Outcome | undefined {
  if (!isRecord(value)) {
    return undefined;
  }
  switch (value.status) {
    case "waiting":
      return { status: "waiting" };
    case "fixed": {
      const minutes = value.minutes;
      return typeof minutes === "number" && Number.isInteger(minutes) && minutes >= 1
        ? { status: "fixed", minutes }
        : undefined;
    }
    case "needs-part": {
      const part = filledText(value.part);
      return part === undefined ? undefined : { status: "needs-part", part };
    }
    case "unrepairable": {
      const reason = filledText(value.reason);
      return reason === undefined ? undefined : { status: "unrepairable", reason };
    }
    default:
      return undefined;
  }
}

export function parseTicket(value: unknown): Ticket {
  if (!isRecord(value)) {
    throw new TicketError("ticket", "a ticket must be a JSON object");
  }
  const { id, category } = value;
  if (typeof id !== "string" || !/^T-\d{3}$/.test(id)) {
    throw new TicketError("id", "id must look like T-001");
  }
  const owner = filledText(value.owner);
  if (owner === undefined) {
    throw new TicketError("owner", "owner must be a non-empty string");
  }
  const item = filledText(value.item);
  if (item === undefined) {
    throw new TicketError("item", "item must be a non-empty string");
  }
  if (!isCategory(category)) {
    throw new TicketError("category", `category must be one of ${CATEGORIES.join(", ")}`);
  }
  const outcome = parseOutcome(value.outcome);
  if (outcome === undefined) {
    throw new TicketError("outcome", "outcome is missing or invalid");
  }
  return { id, owner, item, category, outcome };
}

export async function loadTickets(file: string): Promise<LoadResult> {
  const data: unknown = JSON.parse(await readFile(file, "utf8"));
  if (!Array.isArray(data)) {
    throw new TicketError("tickets", "the file must hold a JSON array of tickets");
  }
  const tickets: Ticket[] = [];
  const rejected: Rejection[] = [];
  const seen = new Set<string>();
  data.forEach((entry: unknown, index) => {
    try {
      const ticket = parseTicket(entry);
      if (seen.has(ticket.id)) {
        throw new TicketError("id", `duplicate id ${ticket.id}`);
      }
      seen.add(ticket.id);
      tickets.push(ticket);
    } catch (error) {
      if (!(error instanceof TicketError)) {
        throw error;
      }
      rejected.push({ index, field: error.field });
    }
  });
  return { tickets, rejected };
}

function assertNever(value: never): never {
  throw new Error(`Unexpected outcome: ${JSON.stringify(value)}`);
}

export function describeOutcome(outcome: Outcome): string {
  switch (outcome.status) {
    case "waiting":
      return "waiting for a volunteer";
    case "fixed":
      return `fixed in ${outcome.minutes} min`;
    case "needs-part":
      return `needs part: ${outcome.part}`;
    case "unrepairable":
      return `unrepairable: ${outcome.reason}`;
    default:
      return assertNever(outcome);
  }
}

export function countBy<T, K extends string>(items: readonly T[], keyOf: (item: T) => K): Map<K, number> {
  const counts = new Map<K, number>();
  for (const item of items) {
    const key = keyOf(item);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

export function applyUpdate(ticket: Readonly<Ticket>, update: TicketUpdate): Ticket {
  return { ...ticket, ...update };
}

export async function costParts(tickets: readonly Ticket[], shop: PartsShop): Promise<PartsQuote> {
  const needed: string[] = [];
  for (const ticket of tickets) {
    if (ticket.outcome.status === "needs-part") {
      needed.push(ticket.outcome.part);
    }
  }
  const parts = [...new Set(needed)];
  const outcomes = await Promise.allSettled(parts.map((part) => shop.priceOf(part)));
  const prices = new Map<string, number>();
  const unavailable: string[] = [];
  outcomes.forEach((outcome, index) => {
    if (outcome.status === "fulfilled") {
      prices.set(parts[index], outcome.value);
    } else {
      unavailable.push(parts[index]);
    }
  });
  const totalCents = needed.reduce((sum, part) => sum + (prices.get(part) ?? 0), 0);
  return { prices, unavailable, totalCents };
}
