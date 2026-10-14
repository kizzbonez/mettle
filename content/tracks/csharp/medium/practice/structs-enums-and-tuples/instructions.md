The struct, both enums and every signature are in the starter. Do not change the enums. Write the
bodies marked with `throw new NotImplementedException();`.

1. **`BoxSize`** is a `readonly struct` with `Width`, `Depth` and `Height` in centimetres. Its
   constructor is complete. Write three members:
   - `int Volume` is a computed property: width times depth times height.
   - `ToString()` gives the three measurements joined by `x`, such as `20x20x10`.
   - `Deconstruct(out int width, out int depth, out int height)` hands out the three
     measurements in that order.

   A default `BoxSize` then prints as `0x0x0` and has a volume of `0` without any extra code.
2. **`Allergen`** is a `[Flags]` enum, so one value can hold several allergens. Write two
   methods of the static class `Bakery`:
   - `bool IsSafeFor(Allergen recipe, Allergen avoided)` is `true` when the recipe contains
     none of the allergens the customer avoids. A customer who avoids `None` can eat anything.
   - `Allergen Without(Allergen recipe, Allergen removed)` is the recipe with every removed
     allergen taken out. Removing an allergen the recipe does not contain changes nothing.
3. **`CakeSize`** numbers each size by its diameter in centimetres.
   `CakeSize? SizeFor(int centimetres)` returns the size with that number, or `null` when no
   size has it. The number comes from a customer, so check it before you trust it.
4. `(int Full, int Left) Pack(int cakes, int perBox)` returns how many boxes an order fills
   completely and how many cakes are left over. `cakes` is never negative and `perBox` is at
   least 1.

Example:

```csharp
var box = new BoxSize(20, 20, 10);
box.Volume                                              // 4000
box.ToString()                                          // "20x20x10"
var (width, _, height) = box;                           // width 20, height 10

var brownie = Allergen.Gluten | Allergen.Milk | Allergen.Egg;
Bakery.IsSafeFor(brownie, Allergen.Nuts)                // true
Bakery.IsSafeFor(brownie, Allergen.Milk | Allergen.Nuts) // false: it has milk
Bakery.Without(brownie, Allergen.Milk | Allergen.Egg)   // Allergen.Gluten

Bakery.SizeFor(20)                                      // CakeSize.Medium
Bakery.SizeFor(18)                                      // null

var (full, left) = Bakery.Pack(14, 4);                  // full 3, left 2
```
