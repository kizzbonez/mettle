func Test(t *testing.T) {
	stock := tally([]string{"fern", " Mint", "fern", "", "spider plant"})
	check.Equal(stock, map[string]int{"fern": 2, "mint": 1, "spider plant": 1}, "tally of the example cuttings")

	check.Equal(take(stock, "mint"), true, `take(stock, "mint") when there is one mint`)
	check.Equal(stock, map[string]int{"fern": 2, "spider plant": 1}, "the stock after taking the last mint")
	check.Equal(take(stock, "cactus"), false, `take(stock, "cactus") when there is no cactus`)
	check.Equal(stock, map[string]int{"fern": 2, "spider plant": 1}, "the stock after asking for a cactus")

	check.Equal(board(stock), []string{"fern: 2", "spider plant: 1"}, "board(stock)")

	got := wishlists([]string{"Ada:Basil", "Bo: basil", "Ada:basil", "Cy:fig", "no colon"})
	check.Equal(got, map[string][]string{"basil": {"Ada", "Bo"}, "fig": {"Cy"}}, "wishlists of the example cards")
}
