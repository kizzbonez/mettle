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

export type Material = keyof typeof MATERIALS;
export type Profile = (typeof MATERIALS)[Material];
export type Setting = keyof Profile;
export type Part = PrintJob["parts"][number];

export function isMaterial(name: string): name is Material {
  return Object.hasOwn(MATERIALS, name);
}

export function profileFor(name: string): Profile | undefined {
  return isMaterial(name) ? MATERIALS[name] : undefined;
}

export function settingOf<K extends Setting>(material: Material, key: K): Profile[K] {
  return MATERIALS[material][key];
}

export function settingTable<K extends Setting>(key: K): [Material, Profile[K]][] {
  const rows: [Material, Profile[K]][] = [];
  for (const [name, profile] of Object.entries(MATERIALS)) {
    if (isMaterial(name)) {
      rows.push([name, profile[key]]);
    }
  }
  return rows;
}
