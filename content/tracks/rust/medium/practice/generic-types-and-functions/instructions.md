Write the body of each function and method. The struct, the `impl` lines and the signatures
are in the starter. Change one signature only: `largest` is missing a bound.

1. `largest<T>(items: &[T]) -> Option<&T>` returns a reference to the largest item, or `None`
   for an empty slice. When several items are equally large, it returns the first of them.
   The body compares two values of type `T`, so `T` needs a bound. Add `PartialOrd` and
   nothing else: the tests call `largest` with numbers, with text, and with a type of their
   own that can be compared but can be neither copied nor printed.
2. `Carton<T>` is a labelled carton for items of any one type. In `impl<T> Carton<T>`:
   - `new(label: &str) -> Carton<T>` is an empty carton with that label.
   - `label(&self) -> &str` is the label.
   - `pack(&mut self, item: T)` puts one more item in, after the ones already there.
   - `items(&self) -> &[T]` is the contents, in the order they were packed.
   - `repack<U>(self, items: Vec<U>) -> Carton<U>` uses the carton again. The result has the
     same label and holds the new items, which may be of another type. What the carton held
     before is dropped.
3. `total_kg(&self) -> f64`, in `impl Carton<f64>`, adds up a carton of weights in kilograms.
   An empty carton weighs `0.0`. No other kind of carton has this method.

Example:

```rust
let mut kitchen = Carton::new("kitchen");
kitchen.pack("kettle");
kitchen.pack("toaster");
kitchen.label()                  // "kitchen"
kitchen.items()                  // ["kettle", "toaster"]
largest(kitchen.items())         // Some(&"toaster"), the last in the alphabet

let weights = kitchen.repack(vec![1.5, 2.25, 0.5]);
weights.label()                  // "kitchen"
weights.total_kg()               // 4.25
largest(weights.items())         // Some(&2.25)
largest::<u32>(&[])              // None
```
