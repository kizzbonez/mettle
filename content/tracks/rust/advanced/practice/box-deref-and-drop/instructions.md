The `Bag` enum, the `Locker` struct and `Locker::new` are complete in the starter. Keep them,
the `impl` headers and every signature as they are, and write the five bodies.

1. `pack(weight: u32, inner: Bag) -> Bag` puts `inner` into a new bag that weighs `weight`
   grams, and returns the outer bag: a `Bag::Packed` with `weight` first and `inner`, moved to
   the heap, second.
2. `total_weight(bag: &Bag) -> u32` is the weight in grams of a bag together with everything
   packed inside it, however deep the packing goes.
3. `Deref for Locker`: a locker dereferences to the bag stored in it, so that a `&Locker` can
   be passed wherever a `&Bag` is expected.
4. `Drop for Locker`: a locker that is dropped prints one line, `locker N is free`, where `N`
   is its number.
5. `first_pickup(early: Bag, late: Bag)` stores `early` in locker 1 and `late` in locker 2. It
   then makes exactly these four lines appear, in this order:
   - `stored W g`, where `W` is the total weight of both bags. Pass the lockers themselves to
     `total_weight`;
   - `locker 1 is free`, because the first bag is collected at once;
   - `one left`;
   - `locker 2 is free`, when the function ends.

   The two `is free` lines are printed by your `Drop`, so `first_pickup` itself prints only
   the other two.

Example:

```rust
let locker = Locker::new(7, pack(900, pack(250, Bag::Empty(40))));   // a pouch in a bag in a suitcase
println!("{}", total_weight(&locker));                               // 1190: a &Locker used as a &Bag
// when `locker` goes out of scope:                                     locker 7 is free

first_pickup(pack(900, Bag::Empty(100)), Bag::Empty(400));
// stored 1400 g
// locker 1 is free
// one left
// locker 2 is free
```

**Tip:** the tests read what your code prints, so each line must match exactly, with nothing
before or after it.
