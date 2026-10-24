package main

import (
	"errors"
	"time"
)

// ErrQuiet means that no radio call came in before the time limit.
var ErrQuiet = errors.New("no radio call before the time limit")

// firstCall returns the first message from either channel, as "coastguard: ..." or
// "harbour: ...", or ErrQuiet when nothing arrives within limit.
func firstCall(coastguard, harbour <-chan string, limit time.Duration) (string, error) {
	panic("not implemented")
}

// watchLog logs every message from both channels, in arrival order, until both are closed.
func watchLog(coastguard, harbour <-chan string) []string {
	panic("not implemented")
}

// broadcast sends one line per tick of a ticker with period every, until the lines run out or
// quit is closed, and returns how many lines it sent.
func broadcast(lines []string, every time.Duration, quit <-chan struct{}, send func(line string)) int {
	panic("not implemented")
}
