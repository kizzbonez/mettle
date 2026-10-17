// The recycling centre at the edge of town takes three materials, and gives
// regular visitors credit points that they spend at the town's repair cafe.

// TODO (task 1): replace `string` with a union of the three literal types
// "glass", "paper" and "metal".
export type Material = string;

// One drop-off: either a number of full bags, or loose material weighed on the
// scale. The `kind` property tells the two apart.
export type DropOff =
  | { kind: "bags"; material: Material; bags: number }
  | { kind: "loose"; material: Material; kg: number };

export function parseMaterial(text: string): Material | undefined {
  throw new Error("Not implemented");
}

export function binColour(material: Material): string {
  throw new Error("Not implemented");
}

export function creditPoints(drop: DropOff): number {
  throw new Error("Not implemented");
}
