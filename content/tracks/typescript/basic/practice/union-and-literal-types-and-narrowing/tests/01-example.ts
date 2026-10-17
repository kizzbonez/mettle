import { binColour, creditPoints, parseMaterial } from "./solution.js";

// The examples from the instructions.
check.equal(parseMaterial(" Glass "), "glass", 'parseMaterial(" Glass ")');
check.equal(parseMaterial("plastic"), undefined, 'parseMaterial("plastic")');
check.equal(binColour("paper"), "blue", 'binColour("paper")');
check.equal(creditPoints({ kind: "bags", material: "paper", bags: 3 }), 6, "3 bags of paper");
check.equal(creditPoints({ kind: "loose", material: "glass", kg: 7.8 }), 7, "7.8 kg of loose glass");
check.equal(creditPoints({ kind: "loose", material: "metal", kg: 2.5 }), 4, "2.5 kg of loose metal");
