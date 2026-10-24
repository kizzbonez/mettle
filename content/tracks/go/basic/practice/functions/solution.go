package main

import "strconv"

// scoreArrow returns the points of one arrow as the judge calls it, and
// whether the call was valid.
func scoreArrow(call string) (points int, ok bool) {
	switch call {
	case "X":
		return 10, true // the inner ten scores ten
	case "M":
		return 0, true // a miss is a valid call worth nothing
	}
	n, err := strconv.Atoi(call)
	if err != nil || n < 1 || n > 10 {
		return 0, false
	}
	return n, true
}

// endTotal adds up the arrows of one end. golds counts the arrows that scored
// 9 or 10, and ok is false if any call was not valid.
func endTotal(calls ...string) (total, golds int, ok bool) {
	for _, call := range calls {
		points, valid := scoreArrow(call)
		if !valid {
			return 0, 0, false // one bad call spoils the whole end
		}
		total += points
		if points >= 9 {
			golds++
		}
	}
	return total, golds, true
}

// countArrows returns how many of the points satisfy rule.
func countArrows(rule func(int) bool, points ...int) int {
	count := 0
	for _, p := range points {
		if rule(p) {
			count++
		}
	}
	return count
}

// newRoundTally returns a tally for a round of the given number of ends.
func newRoundTally(ends int) func(endScore int) (total int, done bool) {
	sum, added := 0, 0
	return func(endScore int) (int, bool) {
		if added < ends {
			sum += endScore
			added++
		}
		// Once the round is complete, extra ends change nothing.
		return sum, added == ends
	}
}
