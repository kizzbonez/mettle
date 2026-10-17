// The lost property office of the city's railway logs every item handed in at
// any of its stations.

export interface FoundItem {
  readonly tag: string;
  description: string;
  station: string;
  claimedBy?: string;
}

export function itemLabel(item: FoundItem): string {
  const { tag, description, station, claimedBy } = item;
  const label = `${tag}: ${description}, found at ${station}`;
  return claimedBy === undefined ? label : `${label}, claimed by ${claimedBy}`;
}

export function countByStation(items: readonly FoundItem[]): { [station: string]: number } {
  const counts: { [station: string]: number } = {};
  for (const item of items) {
    const sofar = counts[item.station];
    counts[item.station] = (sofar === undefined ? 0 : sofar) + 1;
  }
  return counts;
}

export function claim(item: FoundItem, name: string): FoundItem {
  return { ...item, claimedBy: name };
}
