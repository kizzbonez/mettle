export const Pass = {
  Morning: "AM",
  Day: "FULL",
  Week: "WEEK",
} as const;

export type Pass = (typeof Pass)[keyof typeof Pass];
export type PassName = keyof typeof Pass;

export const RUNS = ["green", "blue", "red", "black", "off-piste"] as const;
export type Run = (typeof RUNS)[number];

export function isRun(value: string): value is Run {
  return (RUNS as readonly string[]).includes(value);
}

export function lessonsRequired(run: Run): number {
  switch (run) {
    case "green":
    case "blue":
      return 0;
    case "red":
      return 3;
    case "black":
      return 6;
    case "off-piste":
      return 10;
  }
}

export function passPrice(pass: Pass): number {
  switch (pass) {
    case Pass.Morning:
      return 3800;
    case Pass.Day:
      return 5600;
    case Pass.Week:
      return 26500;
  }
}

export function passLabel(name: PassName): string {
  return `${name} (${Pass[name]})`;
}
