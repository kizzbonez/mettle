// The example from the instructions.
import { makeSetters, type Patch, type TicketParts } from "./solution.js";

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;

interface Order {
  readonly id: number;
  drink: string;
  shots: number;
  note?: string;
}

const change: Patch<Order> = { shots: 3 };
change.id = 12;
check.equal(change, { shots: 3, id: 12 }, "a patch can be filled in field by field");

const machine = {
  grinder: "fine",
  temperature: 93,
  steam: false,
  clean() {
    console.log("rinse");
  },
};
const panel = makeSetters(machine);
panel.setTemperature(94);
check.equal(machine.temperature, 94, "setTemperature changes the machine's temperature");
panel.setSteam(true);
check.equal(machine.steam, true, "setSteam changes the machine's steam setting");

export type Cases = [
  Expect<Equal<TicketParts<"large-flat white">, { size: "large"; drink: "flat white" }>>,
  Expect<Equal<TicketParts<"huge-latte">, never>>,
];

export function misuse(): void {
  // @ts-expect-error steam is a boolean
  panel.setSteam("on");
  // @ts-expect-error methods get no setter
  panel.setClean(() => {});
}
