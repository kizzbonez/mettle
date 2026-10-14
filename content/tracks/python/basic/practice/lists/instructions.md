The tests run your file as a script and type commands into it, one per line, until a line that
says `done`. The starter already reads each line, stops at `done`, and splits the line into
`command` and `item`. Every item is a single word, compared exactly as typed, so `Tea` and `tea`
are two different items. Keep the list in `items`, and write only where a comment says
`YOUR CODE`.

1. `add ITEM` puts the item at the **end** of the list. If it is already on the list, print
   `already on the list: ITEM` instead, and leave the list as it is.
2. `urgent ITEM` puts the item at the **front** of the list. If it is already on the list, it
   moves to the front, so it is never listed twice.
3. `got ITEM` takes the item off the list. If it is not on the list, print
   `not on the list: ITEM` instead.
4. After `done`, print two lines: `to buy (N): ` followed by the items in the list's order,
   separated by a comma and a space, where `N` is how many there are; then `by name: ` followed
   by the same items sorted. If the list is empty, print only `nothing to buy`.

Example: with these commands

```text
add milk
add eggs
add bread
add milk
got bread
got butter
urgent coffee
urgent eggs
done
```

the script prints:

```text
already on the list: milk
not on the list: butter
to buy (3): eggs, coffee, milk
by name: coffee, eggs, milk
```

**Tips.** `in` tells you whether an item is on the list; check it before `remove`, which raises
`ValueError` for a missing item. `insert(0, item)` puts an item at the front. `sorted(items)`
gives a sorted copy and leaves `items` in its own order, while `items.sort()` would change it.
`", ".join(...)` from lesson 5 glues the items together.
