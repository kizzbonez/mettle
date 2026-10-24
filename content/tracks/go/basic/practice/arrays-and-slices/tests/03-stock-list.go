func Test(t *testing.T) {
	rack := []int{43, 38, 43, 40, 38, 38, 36}
	check.Equal(stockList(rack), []int{36, 38, 40, 43}, "the stock list of a rack with repeated sizes")
	check.Equal(rack, []int{43, 38, 43, 40, 38, 38, 36}, "the rack keeps its order after the stock list is made")

	check.Equal(stockList([]int{41}), []int{41}, "the stock list of a rack with one pair")
	check.Equal(stockList([]int{39, 39, 39}), []int{39}, "the stock list of a rack of one size")
	check.Equal(len(stockList(nil)), 0, "the stock list of an empty rack is empty")

	list := stockList(rack)
	list[0] = 99
	check.Equal(rack, []int{43, 38, 43, 40, 38, 38, 36}, "changing the stock list does not change the rack")
}
