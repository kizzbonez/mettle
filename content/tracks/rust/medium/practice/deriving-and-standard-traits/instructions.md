The two types, their `derive` lines and the `impl` blocks are in the starter, and the starter
builds. Several things about them are not right yet. Keep the names of the types, variants and
fields, and keep every trait that a `derive` line already lists.

1. **`Size`**. The derived ordering of an enum follows the order of its variants. Put them in
   the order `Kids`, `Regular`, `Large`, so that a smaller size compares as less. A cone is
   `Regular` unless the customer says otherwise: move `#[default]` to that variant.
2. **`Cone`**. The derived ordering of a struct compares its fields from top to bottom. The
   till sorts cones by size first, and by flavour among cones of one size. Put the two fields
   in that order.
3. `smaller(a: Cone, b: Cone) -> Cone` returns the cone that comes first in that ordering.
   Write it with `min`. `min` needs `Ord`, which neither type derives yet: add `Eq`,
   `PartialOrd` and `Ord` to both `derive` lines.
4. Implement `Display` by hand for both types. A `Size` reads `kids`, `regular` or `large`.
   A `Cone` reads as its size, then ` cone, `, then its flavour, for example
   `regular cone, mint`.
5. `From<&str> for Cone` turns a flavour into the cone a customer gets when they name nothing
   else: that flavour, and the default for every other field.

Example:

```rust
Size::default()                         // Size::Regular
Size::Large.to_string()                 // "large"

let mint = Cone::from("mint");
format!("{mint:?}")                     // Cone { size: Regular, flavour: "mint" }
format!("{mint}")                       // regular cone, mint

let large = Cone { size: Size::Large, flavour: String::from("apple") };
let kids = Cone { size: Size::Kids, flavour: String::from("vanilla") };
smaller(large, kids)                    // the kids cone: size is compared before flavour
```
