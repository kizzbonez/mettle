func Test(t *testing.T) {
	stock := tally([]string{"  ROSEMARY ", "rosemary", "Rosemary", "   ", "aloe"})
	check.Equal(stock, map[string]int{"rosemary": 3, "aloe": 1}, "tally trims, lower-cases and skips blank names")

	empty := tally(nil)
	check.Equal(len(empty), 0, "tally of no cuttings has no plants")
	check.True(empty != nil, "tally of no cuttings returns a map the caller can add to")
	empty["ivy"] = 1
	check.Equal(empty["ivy"], 1, "the map from tally of no cuttings can be added to")

	check.True(take(stock, "rosemary"), "take a plant the stall has three of")
	check.Equal(stock["rosemary"], 2, "the count left after taking one of three")
	check.True(take(stock, "rosemary"), "take a plant the stall has two of")
	check.True(take(stock, "rosemary"), "take the last cutting of a plant")
	_, still := stock["rosemary"]
	check.Equal(still, false, "a plant whose last cutting was taken is deleted from the map")
	check.Equal(take(stock, "rosemary"), false, "take a plant after its last cutting is gone")

	before := len(stock)
	check.Equal(take(stock, "orchid"), false, "take a plant the stall never had")
	_, invented := stock["orchid"]
	check.Equal(invented, false, "asking for a missing plant adds no key to the map")
	check.Equal(len(stock), before, "asking for a missing plant leaves the number of plants unchanged")
	check.Equal(stock, map[string]int{"aloe": 1}, "the stock at the end")
}
