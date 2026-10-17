// The example from the instructions.
import { createBarrier, formatStay, limitCalls } from "./solution.js";

const clock: string = formatStay(125, "clock");
const [hours, minutes] = formatStay(125, "parts");
check.equal(clock, "2:05", "formatStay shows 125 minutes on a clock");
check.equal([hours, minutes], [2, 5], "formatStay splits 125 minutes into hours and minutes");

const exit = createBarrier();
check.equal(exit.raise(), 1, "the first raise returns 1");
check.true(exit.open, "a raised barrier is open");
exit.lower();
check.true(!exit.open, "a lowered barrier is closed");

const freeExit = limitCalls((plate: string, stay: number) => `${plate} out after ${stay} min`, 2);
check.equal(freeExit("KD-482", 12), "KD-482 out after 12 min", "the first call goes through");
check.equal(freeExit("KD-482", 30), "KD-482 out after 30 min", "the second call goes through");
check.equal(freeExit("KD-482", 45), undefined, "a third call gets undefined");

export function misuse(): void {
  const raise = exit.raise;
  // @ts-expect-error a method taken off its barrier has no barrier as `this`
  raise();
  // @ts-expect-error the plate is a string
  freeExit(482, 12);
}
