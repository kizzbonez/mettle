The module tree is laid out in the starter: `counter`, its child `counter::rates`, and the
separate module `desk`. Fill it in. Keep every name, every `pub` and every signature that is
already there: the tests reach each item by its path.

1. In `counter`, write `Parcel::new(label: &str, grams: u32) -> Parcel` and
   `grams(&self) -> u32`. The field `grams` is private, so code outside `counter` can read the
   weight only through the method.
2. In `counter`, write the helper `band(grams: u32) -> u32`, the weight band of a parcel: `1`
   up to 500 grams, `2` up to 2000 grams and `3` above that. Each limit belongs to the lower
   band. Leave `band` private: a hidden test checks that code outside `counter` cannot name it.
3. In `counter::rates`, write `postage(parcel: &Parcel) -> u32`, the price in cents: `350` for
   band 1, `590` for band 2 and `990` for band 3. Ask the parent module for the band. A child
   module reaches its parent's private items with `super::`.
4. In `desk`, write `receipt(parcel: &Parcel) -> String`: the label, a colon and a space, the
   weight followed by ` g`, a comma and a space, then the postage followed by ` cents`. A
   `use` written at the top of the file does not reach into `desk`. Give the module a `use`
   line of its own, or write paths that start at `crate`.
5. At the top level, replace the stand-in function `postage` with a re-export, so that
   `postage(&parcel)` is the function `counter::rates::postage` under a shorter path.

Example:

```rust
let parcel = counter::Parcel::new("books", 1200);
parcel.label                         // "books"
parcel.grams()                       // 1200
counter::rates::postage(&parcel)     // 590
postage(&parcel)                     // 590, through the re-export
desk::receipt(&parcel)               // "books: 1200 g, 590 cents"
```
