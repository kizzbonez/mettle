package main

import (
	"fmt"
	"strings"
)

// You will also need the packages bufio, flag, os and strconv: add them to the
// imports when you use them.

// Reading is one hour's count from the bridge's cycle counter.
type Reading struct {
	Hour  string // as written, such as "08:00"
	Count int
}

// parseReading reads one line of the counter's file, such as "08:00 412".
func parseReading(line string) (Reading, error) {
	panic("not implemented")
}

// summary returns the report lines for the day's readings. With busy above 0,
// it also lists the hours with at least that many bikes. It is written for you.
func summary(readings []Reading, busy int) []string {
	if len(readings) == 0 {
		return []string{"no readings"}
	}
	total, busiest := 0, readings[0]
	var busyHours []string
	for _, r := range readings {
		total += r.Count
		if r.Count > busiest.Count {
			busiest = r
		}
		if busy > 0 && r.Count >= busy {
			busyHours = append(busyHours, r.Hour)
		}
	}
	lines := []string{
		fmt.Sprintf("total: %d", total),
		fmt.Sprintf("busiest: %s (%d)", busiest.Hour, busiest.Count),
	}
	if busy > 0 {
		hours := strings.Join(busyHours, " ")
		if hours == "" {
			hours = "none"
		}
		lines = append(lines, fmt.Sprintf("hours with %d or more: %s", busy, hours))
	}
	return lines
}

func main() {
	// Read the -busy flag, then standard input, as the instructions say.
	panic("not implemented")
}
