// The lost property office of the city's railway logs every item handed in at
// any of its stations.

// TODO (task 1): make `tag` read-only, and add an optional property
// `claimedBy`, the name of the person who collected the item.
export interface FoundItem {
  tag: string;
  description: string;
  station: string;
}

export function itemLabel(item: FoundItem): string {
  throw new Error("Not implemented");
}

export function countByStation(items: readonly FoundItem[]): { [station: string]: number } {
  throw new Error("Not implemented");
}

export function claim(item: FoundItem, name: string): FoundItem {
  throw new Error("Not implemented");
}
