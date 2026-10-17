export interface Donation {
  donor: string;
  item: string;
  portions: number;
  bestBefore: Date;
  allergens: string[];
}

export type Parsed<T> = { ok: true; value: T } | { ok: false; errors: string[] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

export function parseDay(text: string): Date | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return undefined;
  }
  const date = new Date(text);
  if (Number.isNaN(date.getTime()) || !date.toISOString().startsWith(text)) {
    return undefined;
  }
  return date;
}

function filledText(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : undefined;
}

function portionsOf(value: unknown): number | undefined {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 50 ? value : undefined;
}

function allergensOf(value: unknown): string[] | undefined {
  if (value === undefined) {
    return [];
  }
  return isStringArray(value) ? [...value] : undefined;
}

export function parseDonation(text: string): Parsed<Donation> {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, errors: ["not valid JSON"] };
  }
  if (!isRecord(data)) {
    return { ok: false, errors: ["expected an object"] };
  }
  const donor = filledText(data.donor);
  const item = filledText(data.item);
  const portions = portionsOf(data.portions);
  const bestBefore = typeof data.bestBefore === "string" ? parseDay(data.bestBefore) : undefined;
  const allergens = allergensOf(data.allergens);
  if (donor === undefined || item === undefined || portions === undefined || bestBefore === undefined || allergens === undefined) {
    const errors: string[] = [];
    if (donor === undefined) {
      errors.push("donor must be a non-empty string");
    }
    if (item === undefined) {
      errors.push("item must be a non-empty string");
    }
    if (portions === undefined) {
      errors.push("portions must be a whole number from 1 to 50");
    }
    if (bestBefore === undefined) {
      errors.push("bestBefore must be a real date written YYYY-MM-DD");
    }
    if (allergens === undefined) {
      errors.push("allergens must be a list of strings");
    }
    return { ok: false, errors };
  }
  return { ok: true, value: { donor, item, portions, bestBefore, allergens } };
}
