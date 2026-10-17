// @clamp: a decorator factory for number accessors that checks the initial value and every assignment.
import { clamp } from "./solution.js";

class Hob {
  @clamp(0, 9) accessor front = 4;
  @clamp(0, 9) accessor back = -3;
  @clamp(100, 230) accessor grill = 180;
}

const hob = new Hob();
check.equal(hob.front, 4, "an initial value inside the limits is kept");
check.equal(hob.back, 0, "an initial value below the minimum becomes the minimum");
hob.front = 12;
check.equal(hob.front, 9, "an assignment above the maximum becomes the maximum");
hob.front = -1;
check.equal(hob.front, 0, "an assignment below the minimum becomes the minimum");
hob.front = 9;
check.equal(hob.front, 9, "the maximum itself is kept");
hob.front = 0;
check.equal(hob.front, 0, "the minimum itself is kept");
hob.front = 6.5;
check.equal(hob.front, 6.5, "a value between the limits is kept as it is");
hob.grill = 90;
check.equal(hob.grill, 100, "each accessor uses its own limits");
check.equal(hob.front, 6.5, "changing one accessor leaves the others alone");

const second = new Hob();
check.equal(second.front, 4, "each instance starts from the initial value");
second.front = 2;
check.equal(hob.front, 6.5, "each instance keeps its own value");

export function misuse(): void {
  class Label {
    // @ts-expect-error clamp is for numbers, not strings
    @clamp(0, 10) accessor text = "hi";
  }
  class Plain {
    // @ts-expect-error clamp needs an accessor, not a plain field
    @clamp(0, 10) size = 3;
  }
  console.log(new Label().text, new Plain().size);
}
