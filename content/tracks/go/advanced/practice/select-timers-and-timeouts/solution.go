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
	select {
	case msg := <-coastguard:
		return "coastguard: " + msg, nil
	case msg := <-harbour:
		return "harbour: " + msg, nil
	case <-time.After(limit):
		return "", ErrQuiet
	}
}

// watchLog logs every message from both channels, in arrival order, until both are closed.
func watchLog(coastguard, harbour <-chan string) []string {
	var entries []string
	// A nil channel is never ready, so setting a closed channel to nil switches its case off.
	for coastguard != nil || harbour != nil {
		select {
		case msg, ok := <-coastguard:
			if !ok {
				coastguard = nil
				continue
			}
			entries = append(entries, "coastguard: "+msg)
		case msg, ok := <-harbour:
			if !ok {
				harbour = nil
				continue
			}
			entries = append(entries, "harbour: "+msg)
		}
	}
	return entries
}

// broadcast sends one line per tick of a ticker with period every, until the lines run out or
// quit is closed, and returns how many lines it sent.
func broadcast(lines []string, every time.Duration, quit <-chan struct{}, send func(line string)) int {
	if len(lines) == 0 {
		return 0
	}
	ticker := time.NewTicker(every)
	defer ticker.Stop()
	sent := 0
	for sent < len(lines) {
		select {
		case <-ticker.C:
			send(lines[sent])
			sent++
		case <-quit: // a nil quit is never ready, so this case then never runs
			return sent
		}
	}
	return sent
}
