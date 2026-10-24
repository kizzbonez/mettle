func Test(t *testing.T) {
	stock := map[string]int{
		"yarrow": 1, "fern": 4, "mint": 2, "basil": 7, "chives": 3, "lavender": 1,
		"thyme": 5, "sage": 2, "oregano": 1, "dill": 6, "aloe": 2, "ivy": 3,
	}
	want := []string{
		"aloe: 2", "basil: 7", "chives: 3", "dill: 6", "fern: 4", "ivy: 3",
		"lavender: 1", "mint: 2", "oregano: 1", "sage: 2", "thyme: 5", "yarrow: 1",
	}
	for range 5 {
		check.Equal(board(stock), want, "the board of twelve plants, in alphabetical order on every call")
	}
	check.Equal(len(stock), 12, "board does not change the stock")
	check.Equal(board(map[string]int{"spider plant": 10}), []string{"spider plant: 10"}, "the board of one plant")
	check.Equal(len(board(map[string]int{})), 0, "the board of an empty stall has no lines")
}
