// The recycling centre at the edge of town takes three materials, and gives
// regular visitors credit points that they spend at the town's repair cafe.

export type Material = "glass" | "paper" | "metal";

// One drop-off: either a number of full bags, or loose material weighed on the
// scale. The `kind` property tells the two apart.
export type DropOff =
  | { kind: "bags"; material: Material; bags: number }
  | { kind: "loose"; material: Material; kg: number };

export function parseMaterial(text: string): Material | undefined {
  const word = text.trim().toLowerCase();
  if (word === "glass" || word === "paper" || word === "metal") {
    return word;
  }
  return undefined;
}

export function binColour(material: Material): string {
  switch (material) {
    case "glass":
      return "green";
    case "paper":
      return "blue";
    case "metal":
      return "grey";
  }
}

export function creditPoints(drop: DropOff): number {
  const points = drop.kind === "bags" ? drop.bags * 2 : Math.floor(drop.kg);
  return drop.material === "metal" ? points * 2 : points;
}
