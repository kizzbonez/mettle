package main

// loadDrum puts every ball into a buffered channel, in order, closes it and returns it.
func loadDrum(balls []int) <-chan int {
	panic("not implemented")
}

// announce starts the caller: a goroutine that turns every ball into a call such as "N 42"
// on a new unbuffered channel, which it closes after the last ball. It returns at once.
func announce(balls <-chan int) <-chan string {
	panic("not implemented")
}

// markCard reads every call until the channel is closed and returns the number of the call
// that completed the card, or 0 if the card was never full.
func markCard(calls <-chan string, card []string) int {
	panic("not implemented")
}
