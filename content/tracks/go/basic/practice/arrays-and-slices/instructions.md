The wall's rack is a slice of shoe sizes, `[]int`, one element for each pair of shoes, in the
order the pairs hang. Write the bodies of the four functions in `solution.go`, keeping their
first lines as they are. The `slices` package helps: add `import "slices"` below the package
line when you use it.

1. **`hireShoes(rack []int, size int) ([]int, bool)`** takes the **first** pair of that size
   off the rack and returns the rack without it, in the same order, and `true`. If no pair of
   that size is on the rack, it returns the rack unchanged and `false`. (`slices.Index`,
   `slices.Delete`.) The caller always uses the returned rack, as with `append`.
2. **`returnShoes(rack []int, sizes ...int) []int`** hangs the returned pairs at the end of the
   rack, in the order given, and returns the new rack. It may be called with no sizes at all.
3. **`stockList(rack []int) []int`** returns every size on the rack **once**, smallest first.
   It must not change the rack: the desk needs the pairs to stay in the order they hang, so do
   not sort `rack` itself, or a slice that shares its array. For an empty rack it returns an
   empty (or nil) slice.
4. **`busiestDay(hires [7]int) int`** takes a week's hires as an **array**, from Monday
   (index 0) to Sunday (index 6), and returns the index of the day with the most hires. When
   several days share the most, return the earliest of them. A week with no hires returns 0.
   `hires[:]` is a slice of the whole array, if you want to use `slices.Max` and
   `slices.Index`.

Example:

```go
rack := []int{38, 42, 40, 42}
rack, ok := hireShoes(rack, 42)  // [38 40 42], true: the first 42 goes
rack, ok = hireShoes(rack, 36)   // [38 40 42], false: no 36 on the rack
rack = returnShoes(rack, 44, 38) // [38 40 42 44 38]
stockList(rack)                  // [38 40 42 44]
rack                             // still [38 40 42 44 38]

week := [7]int{40, 35, 52, 38, 61, 120, 97}
busiestDay(week) // 5: Saturday, with 120 hires
```
