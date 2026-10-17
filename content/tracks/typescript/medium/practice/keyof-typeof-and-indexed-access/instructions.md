Derive the types from `MATERIALS` and `PrintJob` with `keyof`, `typeof` and indexed access, then
write the functions. Use no `any` and no `as`. Most tests check your **types**: lines the compiler
must reject are marked `// @ts-expect-error`.

1. **`Material`**: the names in `MATERIALS` (`"pla" | "petg" | "abs"`), with `keyof typeof`.
2. **`Profile`**: the type of one entry of `MATERIALS`, with an indexed access type.
3. **`Setting`**: the keys of a `Profile` (`"nozzle" | "bed" | "fan"`).
4. **`Part`**: the type of one element of `PrintJob["parts"]`, without writing its fields again.
5. **`isMaterial(name: string): name is Material`** is `true` only for the table's own names.
   Check with `Object.hasOwn`, so that inherited names such as `toString` are refused.
6. **`profileFor(name: string): Profile | undefined`** returns the table's own entry for a name
   typed into the form, or `undefined` for an unknown name.
7. **`settingOf`** returns one setting of one material, typed as that setting:

   ```ts
   export function settingOf<K extends Setting>(material: Material, key: K): Profile[K]
   ```

8. **`settingTable`** returns `[material, value]` pairs for one setting, in the table's order. Loop
   over `Object.entries(MATERIALS)` and use `isMaterial` to turn each name back into a `Material`:

   ```ts
   export function settingTable<K extends Setting>(key: K): [Material, Profile[K]][]
   ```

Example:

```ts
settingOf("petg", "nozzle")     // 240, typed number
settingOf("abs", "fan")         // false, typed boolean
isMaterial("toString")          // false
profileFor("pla")               // { nozzle: 210, bed: 60, fan: true }, the table's own object
profileFor("nylon")             // undefined
settingTable("bed")             // [["pla", 60], ["petg", 80], ["abs", 100]]
settingOf("pla", "speed")       // compile error: "speed" is not a Setting
```
