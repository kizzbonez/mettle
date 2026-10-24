package main

import "slices"

// The rack is a slice of shoe sizes, one element for each pair of shoes,
// in the order the pairs hang on the rack.

// hireShoes takes the first pair of the given size off the rack.
func hireShoes(rack []int, size int) ([]int, bool) {
	i := slices.Index(rack, size)
	if i < 0 {
		return rack, false
	}
	return slices.Delete(rack, i, i+1), true
}

// returnShoes hangs returned pairs at the end of the rack.
func returnShoes(rack []int, sizes ...int) []int {
	return append(rack, sizes...)
}

// stockList returns every size on the rack once, smallest first.
func stockList(rack []int) []int {
	// Build a new slice, so that sorting it leaves the rack's order alone.
	var sizes []int
	for _, size := range rack {
		if !slices.Contains(sizes, size) {
			sizes = append(sizes, size)
		}
	}
	slices.Sort(sizes)
	return sizes
}

// busiestDay returns the day of the week, 0 for Monday to 6 for Sunday, with
// the most hires.
func busiestDay(hires [7]int) int {
	// Index finds the first day with the most hires, so a tie goes to the
	// earlier day.
	return slices.Index(hires[:], slices.Max(hires[:]))
}
