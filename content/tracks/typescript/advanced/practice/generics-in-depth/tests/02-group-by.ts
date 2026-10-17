// groupBy: the key is tied to the item type, and the map's keys have the type at that key.
import { groupBy, type Bike } from "./solution.js";

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;

const fleet: Bike[] = [
  { id: "b1", size: "S", electric: true, dailyRate: 30 },
  { id: "b2", size: "L", electric: false, dailyRate: 20 },
  { id: "b3", size: "S", electric: false, dailyRate: 16 },
  { id: "b4", size: "M", electric: true, dailyRate: 32 },
];
const before = structuredClone(fleet);

const bySize = groupBy(fleet, "size");
const byElectric = groupBy(fleet, "electric");
const byLength = groupBy(["ab", "c", "de", "f"], "length");

export type Cases = [
  Expect<Equal<typeof bySize, Map<"S" | "M" | "L", Bike[]>>>,
  Expect<Equal<typeof byElectric, Map<boolean, Bike[]>>>,
  Expect<Equal<typeof byLength, Map<number, string[]>>>,
];

export function misuse(): void {
  // @ts-expect-error a bike has no colour to group by
  groupBy(fleet, "colour");
}

check.equal([...bySize.keys()], ["S", "L", "M"], "sizes are listed in the order they first appear, not sorted");
check.equal(bySize.get("S")?.map((bike) => bike.id), ["b1", "b3"], "the items of a group keep their original order");
check.equal([...byElectric.keys()], [true, false], "a boolean property works as a key");
check.equal(byElectric.get(false)?.map((bike) => bike.id), ["b2", "b3"], "every non-electric bike is in its group");
check.true(bySize.get("M")?.[0] === fleet[3], "the groups hold the original objects, not copies");
check.equal(fleet, before, "groupBy does not change the list it is given");
check.equal([...byLength.entries()], [[2, ["ab", "de"]], [1, ["c", "f"]]], "groupBy works for any item type and key");
check.equal(groupBy([] as Bike[], "size").size, 0, "an empty list gives an empty map");
