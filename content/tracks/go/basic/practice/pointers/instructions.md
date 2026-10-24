`solution.go` defines a `Bowler`. Its `Handicap` is a `*int` because "no handicap yet" (`nil`) is
not the same as a handicap of 0. Do not change the type. Complete the four functions.

1. **`addGame(b *Bowler, score int) bool`** adds `score` to the end of `b.Games` and returns `true`.
   A score must be from 0 to 300; for any other score, change nothing and return `false`.
2. **`findBowler(team []Bowler, name string) *Bowler`** returns a pointer to the bowler in `team`
   whose name matches `name` without regard to case (`strings.EqualFold`), or `nil` if there is
   none. The pointer must lead to the element **in the slice**, so that a change made through it
   changes the team: use `&team[i]`.
3. **`setHandicap(b *Bowler)`** works out the bowler's average, the sum of `b.Games` divided by how
   many there are (integer division), and sets the handicap to `(200 - average) * 90 / 100`, but
   never below 0. Store it with `new(...)`. A bowler with no games keeps a `nil` handicap.
4. **`handicapOf(b *Bowler) int`** returns the bowler's handicap, or 0 when `b` is `nil` or the
   bowler has no handicap yet. It must never panic.

```go
team := []Bowler{{Name: "Ada"}, {Name: "Bo", Games: []int{150, 170}}}
ada := findBowler(team, "ADA")     // points at team[0]
addGame(ada, 140)                  // true: team[0].Games is now [140]
addGame(ada, 301)                  // false: no such score
setHandicap(ada)                   // average 140, handicap (200-140)*90/100 = 54
handicapOf(&team[0])               // 54
handicapOf(&team[1])               // 0: Bo has no handicap yet
handicapOf(findBowler(team, "Cy")) // 0: there is no Cy, so the pointer is nil
```
