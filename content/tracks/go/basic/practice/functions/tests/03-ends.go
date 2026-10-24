// isMiss is a rule for countArrows, passed by its name.
func isMiss(p int) bool { return p == 0 }

func Test(t *testing.T) {
	total, golds, ok := endTotal("10", "X", "9", "M", "1", "8")
	check.Equal(total, 38, "the total of a six-arrow end")
	check.Equal(golds, 3, "the golds of a six-arrow end, with 10, X and 9")
	check.True(ok, "a six-arrow end of valid calls is valid")

	total, golds, ok = endTotal()
	check.Equal(total, 0, "the total of an end with no arrows")
	check.Equal(golds, 0, "the golds of an end with no arrows")
	check.True(ok, "an end with no arrows is valid")

	calls := []string{"8", "8", "7"}
	total, _, _ = endTotal(calls...)
	check.Equal(total, 23, "the total of an end passed as a slice with ...")

	total, golds, ok = endTotal("X", "Z", "9")
	check.True(!ok, "an end with a call that is not valid")
	check.Equal(total, 0, "the total of an end with a call that is not valid")
	check.Equal(golds, 0, "the golds of an end with a call that is not valid")

	check.Equal(countArrows(isMiss, 0, 5, 0, 0, 10), 3, "misses counted with a rule passed by name")
	check.Equal(countArrows(func(p int) bool { return p%2 == 1 }, 1, 2, 3, 4, 5), 3, "odd scores counted with a function literal")
	check.Equal(countArrows(isMiss), 0, "countArrows with no points")
	calledFor := 0
	countArrows(func(p int) bool { calledFor++; return true }, 4, 4, 4, 4)
	check.Equal(calledFor, 4, "the rule is called once for every point")
}
