`Print`, its two methods and the small interfaces `Pricer` and `Labeller` are written for you.
Build the rest of the counter in `solution.go` by embedding.

1. **`Item`.** Replace `type Item interface{}` with an interface that **embeds** `Pricer` and
   `Labeller`, so an `Item` has both `Price() int` and `Label() string`.
2. **`NewFramed(title string, pence, framePence int) Framed`** returns a framed print. Write it
   as one struct literal that sets the promoted fields `Title` and `Pence` directly as keys,
   which Go 1.27 allows, together with `FramePence`.
3. **`Framed`'s methods.** `Price()` returns the print's price plus the frame's. Then add a method
   `Label() string` of its own, which returns `<title>, framed <price>` with the framed price,
   such as `Gulls, framed £33.00`. Use the helper `pounds` for the price. (Without it, `Framed`
   would use the promoted `Print.Label`: check what that would print, and why.)
4. **`Sale`** embeds an `Item`, so it already has the item's methods. Give it its own
   **`Price() int`**: the item's price less `Percent` percent, rounded down to a whole penny
   (`price * (100 - Percent) / 100`). Do not write a `Label` for `Sale`: the shelf label stays
   the item's own.
5. **`Total(items []Item) int`** returns the price of all the items together.

Example:

```go
dawn := Print{Title: "Harbour at Dawn", Pence: 2400}
gulls := NewFramed("Gulls", 1800, 1500) // Framed{Title: "Gulls", Pence: 1800, FramePence: 1500}
gulls.Title                             // "Gulls": promoted from Print
dawn.Label()                            // "Harbour at Dawn £24.00"
gulls.Price()                           // 3300
gulls.Label()                           // "Gulls, framed £33.00"

sale := Sale{Item: gulls, Percent: 25}
sale.Price()                            // 2475: 25% off 3300
sale.Label()                            // "Gulls, framed £33.00": the framed print's own label
Total([]Item{dawn, gulls, sale})        // 8175
```

A sale can hold any `Item`, even another `Sale`: 50% off a sale price of 4000 is 2000.
