package main

// soundAll reads every berth's depth sensor at the same time, one goroutine per berth, and
// returns the depths in the same order as berths.
func soundAll(berths []string, sound func(berth string) int) []int {
	panic("not implemented")
}

// soundInRounds reads the sensors in rounds of at most perRound at a time, waiting for each
// round to finish before starting the next, and returns the depths in berth order.
func soundInRounds(berths []string, perRound int, sound func(berth string) int) []int {
	panic("not implemented")
}
