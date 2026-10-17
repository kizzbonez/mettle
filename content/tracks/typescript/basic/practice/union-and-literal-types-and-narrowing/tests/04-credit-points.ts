import { creditPoints } from "./solution.js";

check.equal(creditPoints({ kind: "bags", material: "glass", bags: 1 }), 2, "one bag of glass");
check.equal(creditPoints({ kind: "bags", material: "metal", bags: 2 }), 8, "bags of metal earn double");
check.equal(creditPoints({ kind: "bags", material: "paper", bags: 0 }), 0, "no bags at all");
check.equal(creditPoints({ kind: "loose", material: "paper", kg: 12 }), 12, "a whole number of kilograms of paper");
check.equal(creditPoints({ kind: "loose", material: "glass", kg: 0.9 }), 0, "less than one kilogram earns nothing");
check.equal(creditPoints({ kind: "loose", material: "metal", kg: 5.99 }), 10, "loose metal: whole kilograms, then doubled");
check.equal(creditPoints({ kind: "loose", material: "paper", kg: 3 }), 3, "loose material is counted by weight, not as bags");
