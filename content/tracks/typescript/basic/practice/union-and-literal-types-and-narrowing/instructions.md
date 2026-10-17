Tighten the `Material` type and write the three exported functions. `DropOff` is complete: do not
change it.

1. **`Material`.** Replace `string` with a union of the literal types `"glass"`, `"paper"` and
   `"metal"`, in lower case. Tests check that your type rejects `"plastic"` and `"Glass"`.
2. **`parseMaterial(text: string): Material | undefined`** removes spaces around `text`, ignores
   its case, and returns the matching material, or `undefined` for anything else. Compare the
   word with `===` against each material, so that the compiler narrows it to `Material`.
3. **`binColour(material: Material): string`** returns `"green"` for glass, `"blue"` for paper
   and `"grey"` for metal. Use a `switch` with a `case` for each material and no `default`:
   once `Material` is a union, the compiler sees that the three cases cover everything. (While
   it is still `string`, the same `switch` is error `TS2366`.)
4. **`creditPoints(drop: DropOff): number`** works out the points for one drop-off. Check
   `drop.kind` to narrow the drop-off:
   - `"bags"`: 2 points per bag;
   - `"loose"`: 1 point per **whole** kilogram (`Math.floor`), so 7.8 kg earns 7 points;
   - then, for metal of either kind, double the points.

Example:

```ts
parseMaterial(" Glass ")                                       // "glass"
parseMaterial("plastic")                                       // undefined
binColour("paper")                                             // "blue"
creditPoints({ kind: "bags", material: "paper", bags: 3 })     // 6
creditPoints({ kind: "loose", material: "glass", kg: 7.8 })    // 7
creditPoints({ kind: "loose", material: "metal", kg: 2.5 })    // 4: 2 whole kilograms, doubled
```
