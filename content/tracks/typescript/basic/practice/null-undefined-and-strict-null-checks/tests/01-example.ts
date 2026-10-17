import { buzzerName, callNumber, findResident, ringVolume, type Resident } from "./solution.js";

// The example from the instructions.
const residents: Resident[] = [
  { name: "Ines", flat: "1A", phone: "555-0142", ringVolume: 0, awayUntil: null },
  { name: "Tom", flat: "2B", awayUntil: "12 May" },
];

check.equal(findResident(residents, "2B"), residents[1], 'findResident(residents, "2B")');
check.equal(findResident(residents, "9Z"), undefined, 'findResident(residents, "9Z")');
check.equal(callNumber(residents, "1A"), "555-0142", 'callNumber(residents, "1A")');
check.equal(callNumber(residents, "2B"), "front desk", 'callNumber(residents, "2B")');
check.equal(callNumber(residents, "9Z"), "front desk", 'callNumber(residents, "9Z")');
check.equal(ringVolume(residents[0]), 0, "ringVolume(residents[0])");
check.equal(ringVolume(residents[1]), 5, "ringVolume(residents[1])");
check.equal(buzzerName(residents[0]), "Ines", "buzzerName(residents[0])");
check.equal(buzzerName(residents[1]), "Tom (away until 12 May)", "buzzerName(residents[1])");
