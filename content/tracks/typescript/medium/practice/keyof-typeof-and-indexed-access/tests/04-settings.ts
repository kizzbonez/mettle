// settingOf and settingTable return each setting with its own type, in the table's order.
import { settingOf, settingTable, type Material } from "./solution.js";

check.equal([settingOf("pla", "nozzle"), settingOf("pla", "bed"), settingOf("pla", "fan")], [210, 60, true], "every setting of PLA");
check.equal(settingOf("abs", "bed"), 100, "the bed temperature for ABS");

const nozzles: [Material, number][] = settingTable("nozzle");
check.equal(nozzles, [["pla", 210], ["petg", 240], ["abs", 250]], "the nozzle temperature of every material, in table order");
const fans: [Material, boolean][] = settingTable("fan");
check.equal(fans, [["pla", true], ["petg", true], ["abs", false]], "the fan setting of every material");
const hottest = nozzles.reduce((best, row) => (row[1] > best[1] ? row : best));
check.equal(hottest[0], "abs", "the rows can be compared as numbers");

function typeChecksOnly(): void {
  // @ts-expect-error the fan setting is a boolean, not a number
  const fanAsNumber: number = settingOf("abs", "fan");
  // @ts-expect-error a nozzle temperature is a number, not a boolean
  const nozzleAsBoolean: boolean = settingOf("pla", "nozzle");
  // @ts-expect-error "nylon" is not a material
  settingOf("nylon", "bed");
  // @ts-expect-error fan values are booleans
  const fanRows: [Material, number][] = settingTable("fan");
  // @ts-expect-error "speed" is not a setting
  settingTable("speed");
}
check.true(typeof typeChecksOnly === "function", "settingOf and settingTable return Profile[K]");
