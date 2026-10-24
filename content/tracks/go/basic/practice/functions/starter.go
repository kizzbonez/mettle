package main

// scoreArrow returns the points of one arrow as the judge calls it, and
// whether the call was valid.
func scoreArrow(call string) (points int, ok bool) {
	panic("not implemented")
}

// endTotal adds up the arrows of one end. golds counts the arrows that scored
// 9 or 10, and ok is false if any call was not valid.
func endTotal(calls ...string) (total, golds int, ok bool) {
	panic("not implemented")
}

// countArrows returns how many of the points satisfy rule.
func countArrows(rule func(int) bool, points ...int) int {
	panic("not implemented")
}

// newRoundTally returns a tally for a round of the given number of ends.
func newRoundTally(ends int) func(endScore int) (total int, done bool) {
	panic("not implemented")
}
