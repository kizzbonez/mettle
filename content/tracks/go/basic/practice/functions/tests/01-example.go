func Test(t *testing.T) {
	points, ok := scoreArrow("X")
	check.Equal(points, 10, `the points of "X"`)
	check.Equal(ok, true, `"X" is a valid call`)
	_, ok = scoreArrow("11")
	check.Equal(ok, false, `"11" is not a valid call`)

	total, golds, ok := endTotal("X", "9", "7")
	check.Equal(total, 26, `the total of the end "X", "9", "7"`)
	check.Equal(golds, 2, `the golds of the end "X", "9", "7"`)
	check.Equal(ok, true, `the end "X", "9", "7" is valid`)

	isGold := func(p int) bool { return p >= 9 }
	check.Equal(countArrows(isGold, 10, 9, 7, 9, 3), 3, "countArrows(isGold, 10, 9, 7, 9, 3)")

	tally := newRoundTally(2)
	total, done := tally(26)
	check.Equal(total, 26, "the running total after the first of two ends")
	check.Equal(done, false, "a round of two ends is not done after one")
	total, done = tally(18)
	check.Equal(total, 44, "the running total after the second of two ends")
	check.Equal(done, true, "a round of two ends is done after two")
}
