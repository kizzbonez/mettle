package main

import (
	"errors"
	"fmt"
	"strconv"
	"strings"
)

// The sentinel errors that collect wraps. Keep them as they are.
var (
	ErrUnknownBib = errors.New("no runner has this bib")
	ErrCollected  = errors.New("bib already collected")
)

// parseBib reads a bib number such as "417" or "#417", from 1 to 999.
func parseBib(text string) (int, error) {
	digits := strings.TrimPrefix(strings.TrimSpace(text), "#")
	bib, err := strconv.Atoi(digits)
	if err != nil {
		return 0, fmt.Errorf("bib %q: %w", text, err)
	}
	if bib < 1 || bib > 999 {
		return 0, fmt.Errorf("bib %d is not from 1 to 999", bib)
	}
	return bib, nil
}

// collect hands out one bib and returns the runner's name.
func collect(runners map[int]string, collected map[int]bool, text string) (string, error) {
	bib, err := parseBib(text)
	if err != nil {
		return "", err // already says which bib and why
	}
	name, ok := runners[bib]
	if !ok {
		return "", fmt.Errorf("bib %d: %w", bib, ErrUnknownBib)
	}
	if collected[bib] {
		return "", fmt.Errorf("bib %d for %s: %w", bib, name, ErrCollected)
	}
	collected[bib] = true
	return name, nil
}

// collectQueue hands out the bibs for a queue and lists the real problems.
func collectQueue(runners map[int]string, collected map[int]bool, queue []string) (handed int, problems []string) {
	for i, text := range queue {
		_, err := collect(runners, collected, text)
		switch {
		case err == nil:
			handed++
		case errors.Is(err, ErrCollected):
			// The runner already has the bib: nothing to fix.
		default:
			problems = append(problems, fmt.Sprintf("%d: %v", i+1, err))
		}
	}
	return handed, problems
}
