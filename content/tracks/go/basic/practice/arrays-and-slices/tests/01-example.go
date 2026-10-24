func Test(t *testing.T) {
	rack := []int{38, 42, 40, 42}
	rack, ok := hireShoes(rack, 42)
	check.True(ok, "a size 42 was on the rack [38 42 40 42]")
	check.Equal(rack, []int{38, 40, 42}, "the rack after hiring a size 42")

	rack, ok = hireShoes(rack, 36)
	check.True(!ok, "no size 36 on the rack")
	check.Equal(rack, []int{38, 40, 42}, "the rack after asking for a size that is not there")

	rack = returnShoes(rack, 44, 38)
	check.Equal(rack, []int{38, 40, 42, 44, 38}, "the rack after a 44 and a 38 come back")

	check.Equal(stockList(rack), []int{38, 40, 42, 44}, "the stock list of [38 40 42 44 38]")
	check.Equal(rack, []int{38, 40, 42, 44, 38}, "the rack after making the stock list")

	week := [7]int{40, 35, 52, 38, 61, 120, 97}
	check.Equal(busiestDay(week), 5, "the busiest day of a week whose Saturday had 120 hires")
}
