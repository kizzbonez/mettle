Complete the four functions in `solution.go`, using the `slices` and `cmp` packages. A time is
a number of minutes after midnight, so `10*60 + 30` is 10:30.

1. **`sortTrips(ts []Trip)`** sorts `ts` in place by `Minute`, earliest first, and trips at the
   same minute by `Boat`, alphabetically. Use `slices.SortFunc` with `cmp.Compare` and `cmp.Or`.
2. **`nextTrip(ts []Trip, now int) (Trip, bool)`** takes a board sorted as in task 1 and returns
   the first trip whose `Minute` is **at or after** `now`, and `true`: a boat leaving at this very
   minute can still be caught. When there is none, it returns `Trip{}` and `false`. Use
   `slices.BinarySearchFunc`.
3. **`addTrip(ts []Trip, t Trip) []Trip`** takes a sorted board and returns it with `t` inserted
   at its place in the same order (`slices.BinarySearchFunc` and `slices.Insert`). If a trip with
   the same minute and boat is already there, it returns the board unchanged.
4. **`boats(ts []Trip) []string`** returns every boat that appears in `ts`, each once, in
   alphabetical order. It must not change `ts`, not even its order.

```go
ts := []Trip{
	{Minute: 11*60 + 15, Boat: "Otter"},
	{Minute: 10*60 + 45, Boat: "Heron"},
	{Minute: 11*60 + 15, Boat: "Heron"},
	{Minute: 12 * 60, Boat: "Otter"},
}
sortTrips(ts)
// [{645 Heron} {675 Heron} {675 Otter} {720 Otter}]

nextTrip(ts, 11*60)      // {675 Heron}, true
nextTrip(ts, 11*60+15)   // {675 Heron}, true: it leaves right now
nextTrip(ts, 12*60+1)    // {0 }, false: the last boat has gone

ts = addTrip(ts, Trip{Minute: 11 * 60, Boat: "Kingfisher"})
// [{645 Heron} {660 Kingfisher} {675 Heron} {675 Otter} {720 Otter}]
ts = addTrip(ts, Trip{Minute: 11 * 60, Boat: "Kingfisher"})
// unchanged: that trip is already on the board

boats(ts) // [Heron Kingfisher Otter]
```
