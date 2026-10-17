// The example from the instructions.
import { Dryer, Machine, Washer } from "./solution.js";

const washer = new Washer("W1", true);
washer.insert(200);
washer.insert(300);
check.equal(washer.credit, 500, "the credit after inserting 200 and 300 cents");
check.equal(washer.start(), "W1 started", "starting a hot wash with enough credit");
check.equal(washer.credit, 50, "the credit left after a hot wash, kept for the next cycle");
check.equal(washer.describe(), "W1: 450 cents", "describe() of a hot washer");

const dryer = new Dryer("D2", 25);
check.equal(dryer.describe(), "D2: 150 cents, 25 min", "describe() of a 25-minute dryer");
check.throws(() => dryer.start(), "starting a dryer with no credit throws");
check.equal(Machine.installed, 2, "Machine.installed after creating two machines");
check.equal(Object.keys(washer).sort(), ["hot", "id"], "the washer's properties (the credit is #private)");
