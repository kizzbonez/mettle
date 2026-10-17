// The intercom panel at the front door of Linden Court, a block of flats.

export interface Resident {
  name: string;
  flat: string;
  // Not every resident gave a phone number.
  phone?: string;
  // From 0 to 10. 0 is a real setting: the buzzer is muted.
  ringVolume?: number;
  // The date a resident comes back while they are away, or null when at home.
  awayUntil: string | null;
}

// TODO: find gives back undefined when no resident lives in the flat, so this
// return type promises too much. Fix it.
export function findResident(residents: readonly Resident[], flat: string): Resident {
  throw new Error("Not implemented");
}

export function callNumber(residents: readonly Resident[], flat: string): string {
  throw new Error("Not implemented");
}

export function ringVolume(resident: Resident): number {
  throw new Error("Not implemented");
}

export function buzzerName(resident: Resident): string {
  throw new Error("Not implemented");
}
