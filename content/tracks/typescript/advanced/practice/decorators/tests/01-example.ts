// The example from the instructions.
import { clamp, recorded, shown, shownFields } from "./solution.js";

class Oven {
  log: string[] = [];
  @clamp(50, 250) accessor temperature = 300;
  @shown mode = "fan";
  @shown timer = 0;
  serial = "OV-1";

  @recorded
  preheat(to: number): string {
    this.temperature = to;
    return `heating to ${this.temperature}`;
  }
}

const oven = new Oven();
check.equal(oven.temperature, 250, "the initial temperature is clamped to the maximum");
check.equal(oven.preheat(20), "heating to 50", "an assignment below the minimum is clamped to it");
check.equal(oven.log, ["preheat(20)"], "the call to preheat is logged");
check.equal(shownFields(Oven), ["mode", "timer"], "shownFields lists the @shown fields in order");
