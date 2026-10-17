// formatStay: each overload gives its own return type, and the last one accepts either style.
import { formatStay } from "./solution.js";

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;

const clock = formatStay(75, "clock");
const parts = formatStay(75, "parts");
function either(style: "clock" | "parts") {
  return formatStay(75, style);
}

export type Cases = [
  Expect<Equal<typeof clock, string>>,
  Expect<Equal<typeof parts, [hours: number, minutes: number]>>,
  Expect<Equal<ReturnType<typeof either>, string | [hours: number, minutes: number]>>,
];

const clocks: [number, string][] = [
  [0, "0:00"],
  [9, "0:09"],
  [59, "0:59"],
  [60, "1:00"],
  [61, "1:01"],
  [600, "10:00"],
  [1439, "23:59"],
  [1505, "25:05"],
];
for (const [stay, shown] of clocks) {
  check.equal(formatStay(stay, "clock"), shown, `formatStay shows ${stay} minutes as H:MM with two-digit minutes`);
}
check.equal(formatStay(0, "parts"), [0, 0], "no stay is zero hours and zero minutes");
check.equal(formatStay(59, "parts"), [0, 59], "59 minutes is no whole hour yet");
check.equal(formatStay(120, "parts"), [2, 0], "two hours exactly have no minutes left");
check.equal(formatStay(1505, "parts"), [25, 5], "hours do not wrap at 24");
check.equal(either("clock"), "1:15", "a style chosen at run time can be clock");
check.equal(either("parts"), [1, 15], "a style chosen at run time can be parts");

export function misuse(): void {
  // @ts-expect-error the style is clock or parts
  formatStay(75, "hours");
  // @ts-expect-error the clock style returns a string, not a tuple
  const wrong: [number, number] = formatStay(75, "clock");
  // @ts-expect-error the parts style returns a tuple, not a string
  const alsoWrong: string = formatStay(75, "parts");
  console.log(wrong, alsoWrong);
}
