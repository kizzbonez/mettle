package main

import "strconv"

// loadDrum puts every ball into a buffered channel, in order, closes it and returns it.
// The buffer is big enough for all the balls, so the sends never block and no goroutine
// is needed.
func loadDrum(balls []int) <-chan int {
	drum := make(chan int, len(balls))
	for _, ball := range balls {
		drum <- ball
	}
	close(drum)
	return drum
}

// column gives the letter of a ball's column on a 75-ball card: B for 1 to 15, I for 16 to
// 30, N for 31 to 45, G for 46 to 60 and O for 61 to 75.
func column(ball int) string {
	return string("BINGO"[(ball-1)/15])
}

// announce starts the caller: a goroutine that turns every ball into a call such as "N 42"
// on a new unbuffered channel, which it closes after the last ball. It returns at once.
func announce(balls <-chan int) <-chan string {
	calls := make(chan string)
	go func() {
		// The goroutine is the only sender, so it is the one that closes.
		defer close(calls)
		for ball := range balls {
			calls <- column(ball) + " " + strconv.Itoa(ball)
		}
	}()
	return calls
}

// markCard reads every call until the channel is closed and returns the number of the call
// that completed the card, or 0 if the card was never full.
func markCard(calls <-chan string, card []string) int {
	missing := make(map[string]bool, len(card))
	for _, square := range card {
		missing[square] = true
	}
	fullAt, n := 0, 0
	// Keep receiving after the card is full, so the caller can always finish.
	for call := range calls {
		n++
		if missing[call] {
			delete(missing, call)
			if len(missing) == 0 {
				fullAt = n
			}
		}
	}
	return fullAt
}
