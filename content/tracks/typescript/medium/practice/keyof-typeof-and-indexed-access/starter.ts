// 3D Printer Materials
//
// MATERIALS and PrintJob are complete: the table is the single source of truth. Derive the four
// types from it (tasks 1 to 4), then write the functions, without `any` and without `as`.

export const MATERIALS = {
  pla: { nozzle: 210, bed: 60, fan: true },
  petg: { nozzle: 240, bed: 80, fan: true },
  abs: { nozzle: 250, bed: 100, fan: false },
};

export interface PrintJob {
  name: string;
  material: Material;
  parts: { label: string; grams: number }[];
}

// Tasks 1 to 4: each of these is too vague. Derive it instead.
export type Material = string;
export type Profile = unknown;
export type Setting = string;
export type Part = unknown;

// Task 5
export function isMaterial(name: string): name is Material {
  throw new Error("Not implemented");
}

// Task 6
export function profileFor(name: string): Profile | undefined {
  throw new Error("Not implemented");
}

// Task 7: make it generic, so that the result has the type of the setting asked for.
export function settingOf(material: Material, key: Setting): unknown {
  throw new Error("Not implemented");
}

// Task 8: generic too.
export function settingTable(key: Setting): [Material, unknown][] {
  throw new Error("Not implemented");
}
