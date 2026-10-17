import { doors, lockerName, openAllNight } from "./solution.js";

// These lines are type-checked but never run: your types must reject each of them.
function typeChecks(): void {
  // @ts-expect-error the locker's name is text, which cannot be multiplied
  console.log(lockerName * 2);
  // @ts-expect-error the number of doors is a number, which has no toUpperCase
  console.log(doors.toUpperCase());
  // @ts-expect-error whether the locker is open all night is a boolean, not text
  const label: string = openAllNight;
  console.log(label);
}
check.true(typeof typeChecks === "function", "the type checks compiled");
check.equal(typeof lockerName, "string", "the kind of value the locker's name is while the program runs");
