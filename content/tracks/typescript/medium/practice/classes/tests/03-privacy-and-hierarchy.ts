// The credit is hard-private, id and hot are read-only, Machine is abstract, and the static
// counter belongs to the class.
import { Dryer, Machine, Washer, type Describable } from "./solution.js";

const before = Machine.installed;
const washer = new Washer("W3", false);
washer.insert(400);
const dryer = new Dryer("D1", 30);
const second = new Dryer("D9", 5);
check.equal(Machine.installed - before, 3, "Machine.installed counts every machine created");
check.true(!("installed" in washer), "installed belongs to the class, not to each machine");

check.equal(Object.keys(washer).sort(), ["hot", "id"], "a washer's own properties are id and hot only");
check.equal(JSON.stringify(washer), '{"id":"W3","hot":false}', "JSON.stringify does not reveal the credit");
check.equal(Object.keys(dryer).sort(), ["id", "minutes"], "a dryer's own properties are id and minutes only");
check.equal(washer.credit, 400, "the credit is still readable through the getter");

check.true(washer instanceof Machine && dryer instanceof Machine, "washers and dryers are machines");
check.true(!(dryer instanceof Washer), "a dryer is not a washer");

const everything: Describable[] = [washer, dryer, second];
check.equal(
  everything.map((item) => item.describe()),
  ["W3: 350 cents", "D1: 150 cents, 30 min", "D9: 50 cents, 5 min"],
  "every machine describes itself through the Describable interface",
);

function typeChecksOnly(): void {
  // @ts-expect-error a machine's id is read-only
  washer.id = "W9";
  // @ts-expect-error a washer's hot setting is read-only
  washer.hot = true;
  // @ts-expect-error a dryer's minutes are read-only
  dryer.minutes = 90;
  // @ts-expect-error Machine is abstract, so it cannot be created directly
  new Machine("M1");
}
check.true(typeof typeChecksOnly === "function", "read-only fields and the abstract class are enforced by the compiler");
