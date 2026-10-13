The `Vehicle` trait and the structs `Car` and `Truck` are declared in the starter. Keep them
and the signatures as they are. The tests add vehicle types of their own, so the three
functions may rely only on what the trait offers.

1. `impl Vehicle for Car`: the label is `car` and the toll is `250` cents.
2. `impl Vehicle for Truck`: the label is the number of axles followed by `-axle truck`, such
   as `3-axle truck`, and the toll is `400` cents for each axle.
3. `arrive(kind: &str, axles: u32) -> Option<Box<dyn Vehicle>>` builds the vehicle a camera
   reported. The kind `"car"` gives a `Car` (the axles are ignored), `"truck"` gives a `Truck`
   with that many axles, and any other text gives `None`. The kind must match exactly.
4. `total_toll(lane: &[Box<dyn Vehicle>]) -> u32` adds up the toll of every vehicle in the
   lane. An empty lane pays `0`.
5. `apply_discounts(toll: u32, discounts: &[Box<dyn Fn(u32) -> u32>]) -> u32` passes the toll
   through each discount in the order of the slice: the result of one is the input of the
   next. With no discounts the toll comes back unchanged.

Example:

```rust
let lane: Vec<Box<dyn Vehicle>> = vec![Box::new(Car), Box::new(Truck { axles: 3 }), Box::new(Car)];
lane[1].label()                                  // "3-axle truck"
total_toll(&lane)                                // 1700, which is 250 + 1200 + 250

arrive("truck", 2).map(|vehicle| vehicle.toll_cents())   // Some(800)
arrive("tram", 2).is_none()                              // true

let discounts: Vec<Box<dyn Fn(u32) -> u32>> = vec![
    Box::new(|toll| toll / 2),
    Box::new(|toll| toll.saturating_sub(100)),
];
apply_discounts(1700, &discounts)                // 750: halved to 850, then 100 off
```
