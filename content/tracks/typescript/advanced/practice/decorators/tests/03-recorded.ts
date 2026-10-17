// @recorded: a typed method decorator that logs each call before running the original method.
import { recorded } from "./solution.js";

class Microwave {
  log: string[] = [];
  watts = 800;

  @recorded
  heat(seconds: number, label: string): string {
    return `${label}: ${seconds} s at ${this.watts} W`;
  }

  @recorded
  open(): boolean {
    return true;
  }

  @recorded
  defrost(grams: number): number {
    if (grams <= 0) throw new RangeError("nothing to defrost");
    return Math.ceil(grams / 10);
  }
}

const microwave = new Microwave();
check.equal(microwave.heat(90, "soup"), "soup: 90 s at 800 W", "the original method runs with its own this and arguments");
check.equal(microwave.open(), true, "the original method's result is returned");
check.equal(microwave.defrost(450), 45, "a method with one argument runs as before");
check.equal(microwave.log, ["heat(90, soup)", "open()", "defrost(450)"], "each call is logged with its name and arguments, in order");

check.throws(() => microwave.defrost(0), "an error from the method still reaches the caller", RangeError);
check.equal(microwave.log.at(-1), "defrost(0)", "a call is logged even when the method throws");

const other = new Microwave();
other.watts = 1000;
check.equal(other.heat(30, "milk"), "milk: 30 s at 1000 W", "the method uses the instance it was called on");
check.equal(other.log, ["heat(30, milk)"], "each instance has its own log");
check.equal(microwave.log.length, 4, "calls on another instance are not logged here");

export function misuse(): void {
  class Toaster {
    slots = 2;
    // @ts-expect-error a recorded method needs a log on its class
    @recorded
    toast(): void {}
  }
  class Kettle {
    log = 0;
    // @ts-expect-error the log must be an array of strings
    @recorded
    boil(): void {}
  }
  console.log(new Toaster(), new Kettle());
}
