package main

import (
	"fmt"
	"maps"
	"slices"
	"strings"
)

// tally counts the cuttings brought to the stall, by trimmed lower-case name.
func tally(cuttings []string) map[string]int {
	stock := make(map[string]int)
	for _, name := range cuttings {
		name = strings.ToLower(strings.TrimSpace(name))
		if name == "" {
			continue
		}
		stock[name]++ // a new plant reads as 0 first
	}
	return stock
}

// take hands out one cutting of plant and reports whether the stall had one.
func take(stock map[string]int, plant string) bool {
	n, ok := stock[plant]
	if !ok {
		return false // never write a key for a plant the stall does not have
	}
	if n == 1 {
		delete(stock, plant)
	} else {
		stock[plant] = n - 1
	}
	return true
}

// board returns the stall's stock as "name: count" lines in alphabetical order.
func board(stock map[string]int) []string {
	lines := make([]string, 0, len(stock))
	for _, name := range slices.Sorted(maps.Keys(stock)) {
		lines = append(lines, fmt.Sprintf("%s: %d", name, stock[name]))
	}
	return lines
}

// wishlists groups "person:plant" wish cards by plant.
func wishlists(requests []string) map[string][]string {
	wishes := make(map[string][]string)
	for _, card := range requests {
		person, plant, found := strings.Cut(card, ":")
		person = strings.TrimSpace(person)
		plant = strings.ToLower(strings.TrimSpace(plant))
		if !found || person == "" || plant == "" {
			continue
		}
		if !slices.Contains(wishes[plant], person) {
			wishes[plant] = append(wishes[plant], person)
		}
	}
	return wishes
}
