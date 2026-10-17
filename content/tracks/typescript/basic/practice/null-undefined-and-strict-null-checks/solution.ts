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

export function findResident(residents: readonly Resident[], flat: string): Resident | undefined {
  return residents.find((resident) => resident.flat === flat);
}

export function callNumber(residents: readonly Resident[], flat: string): string {
  return findResident(residents, flat)?.phone ?? "front desk";
}

export function ringVolume(resident: Resident): number {
  return resident.ringVolume ?? 5;
}

export function buzzerName(resident: Resident): string {
  if (resident.awayUntil === null) {
    return resident.name;
  }
  return `${resident.name} (away until ${resident.awayUntil})`;
}
