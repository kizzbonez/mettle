Write the two functions in `solution.go`, and add `import "sync"` at the top of the file. Each
depth is a whole number of centimetres.

1. **`soundAll(berths []string, sound func(berth string) int) []int`** reads every berth's sensor
   **at the same time**. Start one goroutine per berth that calls `sound` for that berth, and wait
   for all of them with a `sync.WaitGroup` before you return. Return the depths in the same order
   as `berths`: element `i` is `sound(berths[i])`. Make the result slice before you start the
   goroutines, with one element per berth, and let each goroutine write only its own element.
   With no berths at all, return an empty slice without calling `sound`.
2. **`soundInRounds(berths []string, perRound int, sound func(berth string) int) []int`** does the
   same for a radio that can talk to at most `perRound` sensors at once. Read the berths in
   **rounds**: start the first `perRound` berths together, wait until every one of them has
   answered, then start the next `perRound`, and so on. The last round may be smaller. `perRound`
   is at least 1. Return the depths in berth order, as in task 1. (Tip: each round is a
   `soundAll` of a part of `berths`.)

Call `sound` exactly once for each berth. The tests give you sensors that run on a fake clock:
each one takes a set time to answer (one second, unless a test says otherwise), so the tests can
see how many sensors you read at once and how long the whole reading took. Every test also runs
under the race detector, so two goroutines that touch the same variable without synchronization
fail the test even when the depths come out right.

Example, with four sensors that each take one second to answer:

```go
berths := []string{"A1", "A2", "B1", "B2"}

soundAll(berths, sound)         // [240 185 310 95], after 1 second
soundInRounds(berths, 2, sound) // [240 185 310 95], after 2 seconds
soundInRounds(berths, 3, sound) // [240 185 310 95], after 2 seconds: a round of 3, then 1
soundAll(nil, sound)            // [], at once
```
