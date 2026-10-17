import { readFile } from "node:fs/promises";

// ---------------------------------------------------------------------------------------------
// The domain. CATEGORIES, Category, Ticket, Rejection, LoadResult, PartsShop, PartsQuote and
// TicketError are complete. Outcome and TicketUpdate are yours to finish (tasks 1 and 2).
// ---------------------------------------------------------------------------------------------

export const CATEGORIES = ["electrical", "textile", "bicycle", "furniture"] as const;
export type Category = (typeof CATEGORIES)[number];

// Task 1: add the other three members of the union, as the instructions describe.
export type Outcome = { status: "waiting" };

export interface Ticket {
  id: string;
  owner: string;
  item: string;
  category: Category;
  outcome: Outcome;
}

// Task 2: derive this type from Ticket with utility types, so that only owner, item and
// outcome can be updated, each one optional.
export type TicketUpdate = Partial<Ticket>;

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

// ---------------------------------------------------------------------------------------------
// The functions. Replace each `throw new Error("Not implemented")` with your code. You may add
// helper functions and types of your own.
// ---------------------------------------------------------------------------------------------

// Task 3
export function parseTicket(value: unknown): Ticket {
  throw new Error("Not implemented");
}

// Task 4. `readFile` is already imported for you.
export async function loadTickets(file: string): Promise<LoadResult> {
  throw new Error("Not implemented");
}

// Task 5
export function describeOutcome(outcome: Outcome): string {
  throw new Error("Not implemented");
}

// Task 6: make the key type generic too (see the instructions for the exact signature).
export function countBy<T>(items: readonly T[], keyOf: (item: T) => string): Map<string, number> {
  throw new Error("Not implemented");
}

// Task 7
export function applyUpdate(ticket: Readonly<Ticket>, update: TicketUpdate): Ticket {
  throw new Error("Not implemented");
}

// Task 8
export async function costParts(tickets: readonly Ticket[], shop: PartsShop): Promise<PartsQuote> {
  throw new Error("Not implemented");
}
