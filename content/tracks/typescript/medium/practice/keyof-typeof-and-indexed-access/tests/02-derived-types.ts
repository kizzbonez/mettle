// Material, Profile, Setting and Part are derived exactly, from the table and from PrintJob.
import { MATERIALS, type Material, type Part, type PrintJob, type Profile, type Setting } from "./solution.js";

const names: Material[] = ["pla", "petg", "abs"];
const keys: Setting[] = ["nozzle", "bed", "fan"];
const custom: Profile = { nozzle: 230, bed: 70, fan: true };
const gear: Part = { label: "gear", grams: 12 };
const job: PrintJob = { name: "chess set", material: "pla", parts: [gear, { label: "king", grams: 9 }] };
const firstPart: Part = job.parts[0];

check.equal(names.map((name) => MATERIALS[name].bed), [60, 80, 100], "every Material indexes the table");
check.equal(keys.map((key) => custom[key]), [230, 70, true], "every Setting indexes a Profile");
check.equal(firstPart.grams + job.parts[1].grams, 21, "a Part has its grams as a number");

function typeChecksOnly(): void {
  // @ts-expect-error "nylon" is not in the table
  const nylon: Material = "nylon";
  // @ts-expect-error "speed" is not a setting
  const speed: Setting = "speed";
  // @ts-expect-error a profile needs its fan setting
  const noFan: Profile = { nozzle: 200, bed: 50 };
  // @ts-expect-error a part's grams are a number
  const textGrams: Part = { label: "rook", grams: "8" };
  // @ts-expect-error a part needs a label
  const unlabelled: Part = { grams: 8 };
}
check.true(typeof typeChecksOnly === "function", "the derived types are exact");
