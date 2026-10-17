import { callNumber, ringVolume, type Resident } from "./solution.js";

const building: readonly Resident[] = [
  { name: "Ana", flat: "1A", phone: "555-0101", awayUntil: null },
  { name: "Ben", flat: "1B", awayUntil: null },
  { name: "Cleo", flat: "1C", phone: "555-0103", awayUntil: "3 June" },
];
check.equal(callNumber(building, "1A"), "555-0101", "the phone number of a resident who gave one");
check.equal(callNumber(building, "1C"), "555-0103", "a resident who is away is still phoned");
check.equal(callNumber(building, "1B"), "front desk", "a resident who gave no phone number");
check.equal(callNumber(building, "7G"), "front desk", "a flat nobody lives in");
check.equal(callNumber([], "1A"), "front desk", "a building with no residents");

check.equal(ringVolume({ name: "Dov", flat: "2A", ringVolume: 0, awayUntil: null }), 0, "a muted buzzer keeps its volume of 0");
check.equal(ringVolume({ name: "Eda", flat: "2B", ringVolume: 10, awayUntil: null }), 10, "the loudest volume");
check.equal(ringVolume({ name: "Fin", flat: "2C", ringVolume: 3, awayUntil: null }), 3, "a volume that was set");
check.equal(ringVolume({ name: "Gus", flat: "2D", awayUntil: null }), 5, "a volume that was never set");
check.equal(ringVolume({ name: "Hal", flat: "2E", ringVolume: undefined, awayUntil: null }), 5, "a volume set to undefined");
