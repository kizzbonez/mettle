package main

import (
	"bufio"
	"flag"
	"fmt"
	"os"
	"strconv"
	"strings"
)

// Reading is one hour's count from the bridge's cycle counter.
type Reading struct {
	Hour  string // as written, such as "08:00"
	Count int
}

// parseReading reads one line of the counter's file, such as "08:00 412".
func parseReading(line string) (Reading, error) {
	fields := strings.Fields(line)
	if len(fields) != 2 {
		return Reading{}, fmt.Errorf("expected 2 fields, found %d", len(fields))
	}
	count, err := strconv.Atoi(fields[1])
	if err != nil {
		return Reading{}, fmt.Errorf("count %q: %w", fields[1], err)
	}
	if count < 0 {
		return Reading{}, fmt.Errorf("count %d is negative", count)
	}
	return Reading{Hour: fields[0], Count: count}, nil
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
	busy := flag.Int("busy", 0, "also list the hours with at least this many bikes")
	flag.Parse()
	if *busy < 0 {
		fmt.Fprintln(os.Stderr, "-busy must not be negative")
		os.Exit(2)
	}

	var readings []Reading
	rejected := false
	scanner := bufio.NewScanner(os.Stdin)
	lineNo := 0
	for scanner.Scan() {
		lineNo++ // count every line, so the numbers match the file
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		reading, err := parseReading(line)
		if err != nil {
			fmt.Fprintf(os.Stderr, "line %d: %v\n", lineNo, err)
			rejected = true
			continue
		}
		readings = append(readings, reading)
	}
	if err := scanner.Err(); err != nil {
		fmt.Fprintln(os.Stderr, "reading input:", err)
		os.Exit(1)
	}

	for _, line := range summary(readings, *busy) {
		fmt.Println(line)
	}
	if rejected {
		os.Exit(1)
	}
}
