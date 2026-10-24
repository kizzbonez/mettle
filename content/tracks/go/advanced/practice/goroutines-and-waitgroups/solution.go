package main

import "sync"

// soundAll reads every berth's depth sensor at the same time, one goroutine per berth, and
// returns the depths in the same order as berths.
func soundAll(berths []string, sound func(berth string) int) []int {
	depths := make([]int, len(berths))
	var wg sync.WaitGroup
	for i, berth := range berths {
		// Each goroutine writes only its own element, so no two of them touch the
		// same memory, and Wait makes every write visible before we return.
		wg.Go(func() {
			depths[i] = sound(berth)
		})
	}
	wg.Wait()
	return depths
}

// soundInRounds reads the sensors in rounds of at most perRound at a time, waiting for each
// round to finish before starting the next, and returns the depths in berth order.
func soundInRounds(berths []string, perRound int, sound func(berth string) int) []int {
	depths := make([]int, 0, len(berths))
	for start := 0; start < len(berths); start += perRound {
		end := min(start+perRound, len(berths))
		// soundAll returns only when the whole round has answered.
		depths = append(depths, soundAll(berths[start:end], sound)...)
	}
	return depths
}
