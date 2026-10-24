func Test(t *testing.T) {
	rack, ok := hireShoes([]int{40, 39, 40, 41}, 40)
	check.True(ok, "hiring a size that hangs on the rack twice")
	check.Equal(rack, []int{39, 40, 41}, "only the first pair of that size is taken, and the order is kept")

	rack, ok = hireShoes([]int{37, 44}, 44)
	check.True(ok, "hiring the last pair on the rack")
	check.Equal(rack, []int{37}, "the rack after hiring its last pair")

	rack, ok = hireShoes([]int{45}, 45)
	check.True(ok, "hiring the only pair")
	check.Equal(len(rack), 0, "the length of the rack after hiring its only pair")

	rack, ok = hireShoes(nil, 40)
	check.True(!ok, "hiring from an empty rack")
	check.Equal(len(rack), 0, "an empty rack stays empty")

	rack, ok = hireShoes([]int{38, 39}, 41)
	check.True(!ok, "hiring a size that is not on the rack")
	check.Equal(rack, []int{38, 39}, "the rack is unchanged when the size is not there")

	check.Equal(returnShoes([]int{38}, 39, 40, 41), []int{38, 39, 40, 41}, "three pairs returned at once, at the end in that order")
	check.Equal(returnShoes([]int{38, 39}), []int{38, 39}, "returnShoes with no pairs")
	check.Equal(returnShoes(nil, 42), []int{42}, "a pair returned to an empty rack")
	back := []int{36, 37}
	check.Equal(returnShoes([]int{40}, back...), []int{40, 36, 37}, "pairs passed as a slice with ...")
}
