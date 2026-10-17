// The example from the instructions.
import { isMaterial, MATERIALS, profileFor, settingOf, settingTable } from "./solution.js";

const nozzle: number = settingOf("petg", "nozzle");
const fan: boolean = settingOf("abs", "fan");
check.equal(nozzle, 240, 'settingOf("petg", "nozzle")');
check.equal(fan, false, 'settingOf("abs", "fan")');
check.equal(isMaterial("toString"), false, 'isMaterial("toString")');
check.true(profileFor("pla") === MATERIALS.pla, 'profileFor("pla") returns the table\'s own entry');
check.equal(profileFor("nylon"), undefined, 'profileFor("nylon")');
check.equal(settingTable("bed"), [["pla", 60], ["petg", 80], ["abs", 100]], 'settingTable("bed")');

function typeChecksOnly(): void {
  // @ts-expect-error "speed" is not a setting
  settingOf("pla", "speed");
}
check.true(typeof typeChecksOnly === "function", "settingOf accepts only the settings of a profile");
