Complete the four functions in `solution.go`. A plant's name is its key in a `map[string]int`
that holds how many cuttings of it the stall has.

1. **`tally(cuttings []string) map[string]int`** counts the cuttings people brought, one name per
   element. Remove spaces around each name and turn it into lower case (`strings.TrimSpace`,
   `strings.ToLower`), so `" Fern"` and `"fern"` are the same plant. Skip names that are empty
   after trimming. Always return a map the caller can add to, even when there are no cuttings.
2. **`take(stock map[string]int, plant string) bool`** hands out one cutting of `plant`. If the
   stall has it, take one away and return `true`; when that was the last cutting, delete the plant
   from the map. If the stall does not have it, return `false` and leave the map exactly as it
   was: no new key, no negative count. Use the comma-ok idiom.
3. **`board(stock map[string]int) []string`** returns one line per plant, `"name: count"`, in
   alphabetical order of the names, the same order on every call.
4. **`wishlists(requests []string) map[string][]string`** groups wish cards by plant. A card reads
   `"person:plant"`. Split it at the first colon (`strings.Cut`), remove spaces around both parts,
   and lower-case the plant (not the person). Skip a card with no colon, or with an empty person or
   plant. Each plant maps to the people who wished for it, in the order of the cards, and a person
   who wished for the same plant twice is listed once (`slices.Contains`).

```go
stock := tally([]string{"fern", " Mint", "fern", "", "spider plant"})
// map[fern:2 mint:1 spider plant:1]

take(stock, "mint")   // true, and mint is deleted: it was the last one
take(stock, "cactus") // false, and stock is unchanged
board(stock)          // []string{"fern: 2", "spider plant: 1"}

wishlists([]string{"Ada:Basil", "Bo: basil", "Ada:basil", "Cy:fig", "no colon"})
// map[basil:[Ada Bo] fig:[Cy]]
```
