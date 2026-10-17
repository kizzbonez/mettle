Finish the interface and write the three exported functions in `solution.ts`.

1. **`FoundItem`.** Make `tag` a `readonly` property, since an item keeps its tag for good, and
   add an **optional** property `claimedBy` of type `string`, the name of the person who
   collected it. A test checks that your interface rejects changing a tag, an item without a
   description, a `claimedBy` that is not text, and a misspelled `claimedby`.
2. **`itemLabel(item: FoundItem): string`** returns `"<tag>: <description>, found at <station>"`,
   followed by `", claimed by <claimedBy>"` only when `claimedBy` is there. Check it against
   `undefined` first. Destructuring the item is a tidy way to start.
3. **`countByStation(items: readonly FoundItem[]): { [station: string]: number }`** returns a
   dictionary with the number of items found at each station. A station with no items has no
   key at all, so an empty array gives `{}`. Remember that a missing key reads as `undefined`.
4. **`claim(item: FoundItem, name: string): FoundItem`** returns a **copy** of the item with
   `claimedBy` set to `name`, made with spread. The item passed in must not change. Claiming an
   item a second time replaces the name.

Example:

```ts
const umbrella: FoundItem = { tag: "LP-104", description: "blue umbrella", station: "Riverside" };
const scarf: FoundItem = { tag: "LP-105", description: "red scarf", station: "Central" };

itemLabel(umbrella)
// "LP-104: blue umbrella, found at Riverside"

const collected = claim(umbrella, "Ines");
itemLabel(collected)
// "LP-104: blue umbrella, found at Riverside, claimed by Ines"
umbrella.claimedBy
// undefined: the original is unchanged

countByStation([umbrella, scarf, collected])
// { Riverside: 2, Central: 1 }
```
