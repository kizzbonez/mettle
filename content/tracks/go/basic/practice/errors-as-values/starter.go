package main

import "errors"

// You will also need the packages fmt, strconv and strings: add them to the
// imports when you use them.

// The sentinel errors that collect wraps. Keep them as they are.
var (
	ErrUnknownBib = errors.New("no runner has this bib")
	ErrCollected  = errors.New("bib already collected")
)

// parseBib reads a bib number such as "417" or "#417", from 1 to 999.
func parseBib(text string) (int, error) {
	panic("not implemented")
}

// collect hands out one bib and returns the runner's name.
func collect(runners map[int]string, collected map[int]bool, text string) (string, error) {
	panic("not implemented")
}

// collectQueue hands out the bibs for a queue and lists the real problems.
func collectQueue(runners map[int]string, collected map[int]bool, queue []string) (handed int, problems []string) {
	panic("not implemented")
}
