// Setters and makeSetters: renamed keys, function keys dropped, values written to the target.
import { makeSetters, type Setters } from "./solution.js";

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;

interface Grinder {
  coarseness: number;
  beans: "house" | "decaf";
  hopperFull: boolean;
  purge: () => void;
  weigh(grams: number): string;
}

export type Cases = [
  Expect<
    Equal<
      Setters<Grinder>,
      {
        setCoarseness: (value: number) => void;
        setBeans: (value: "house" | "decaf") => void;
        setHopperFull: (value: boolean) => void;
      }
    >
  >,
  Expect<Equal<Setters<{ x: string }>, { setX: (value: string) => void }>>,
  Expect<Equal<Setters<{ run: () => number }>, {}>>,
];

const grinder: Grinder = {
  coarseness: 4,
  beans: "house",
  hopperFull: true,
  purge: () => {},
  weigh: (grams) => `${grams} g`,
};
const controls = makeSetters(grinder);
check.equal(
  Object.keys(controls).toSorted(),
  ["setBeans", "setCoarseness", "setHopperFull"],
  "there is one setter for each property that is not a function, and nothing else",
);
controls.setCoarseness(7);
controls.setBeans("decaf");
controls.setHopperFull(false);
check.equal(grinder.coarseness, 7, "setCoarseness writes to the original object");
check.equal(grinder.beans, "decaf", "setBeans writes to the original object");
check.equal(grinder.hopperFull, false, "setHopperFull writes to the original object, even a false value");
controls.setCoarseness(2);
check.equal(grinder.coarseness, 2, "a setter can be called again");

const tiny = { x: 1, y: 2 };
const tinyControls = makeSetters(tiny);
tinyControls.setY(5);
check.equal(tiny, { x: 1, y: 5 }, "single-letter keys get setters, and only their own key changes");
check.equal(Object.keys(makeSetters({})), [], "an empty object gets no setters");

const other = { x: 1, y: 2 };
makeSetters(other).setX(9);
check.equal(tiny.x, 1, "each object's setters write only to that object");

export function misuse(): void {
  // @ts-expect-error the beans are house or decaf
  controls.setBeans("robusta");
  // @ts-expect-error purge is a function, so it has no setter
  controls.setPurge(() => {});
  // @ts-expect-error weigh is a method, so it has no setter
  controls.setWeigh(() => "");
  // @ts-expect-error setter names start with a capital letter after set
  controls.setcoarseness(3);
}
