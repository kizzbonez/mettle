// @shown and shownFields: field names collected in context.metadata and read from Symbol.metadata.
import { clamp, shown, shownFields } from "./solution.js";

class Fridge {
  @shown temperature = 4;
  doorAlarm = true;
  @shown mode = "eco";
  @shown iceMaker = false;
  @clamp(1, 7) accessor shelfLight = 3;
}

class Freezer {
  @shown temperature = -18;
}

class Dishwasher {
  programme = "quick";
}

check.equal(shownFields(Fridge), ["temperature", "mode", "iceMaker"], "only the @shown fields are listed, in declaration order");
check.equal(shownFields(Freezer), ["temperature"], "each class has its own list");
check.equal(shownFields(Fridge), ["temperature", "mode", "iceMaker"], "reading the list twice gives the same names");
check.equal(shownFields(Dishwasher), [], "a class without decorators has no shown fields");
const list = shownFields(Freezer);
list.push("defrost");
check.equal(shownFields(Freezer), ["temperature"], "shownFields returns a new array, so changing it changes nothing");
check.equal(new Fridge().mode, "eco", "@shown leaves the field's value alone");

export function misuse(): void {
  class Hood {
    // @ts-expect-error shown is for fields, not methods
    @shown
    extract(): void {}
  }
  console.log(new Hood());
}
