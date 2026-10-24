import "slices"

func Test(t *testing.T) {
	log := "North 3.5\nSouth 1.25\n\nNorth heavy\nPier 6\nPier 0\n"
	var got []Bag
	for b := range bags(log) {
		got = append(got, b)
	}
	check.Equal(got, []Bag{{"North", 3.5}, {"South", 1.25}, {"Pier", 6}}, "the bags in the example log")

	check.Equal(slices.Collect(heavier(bags(log), 3.5)), []Bag{{"North", 3.5}, {"Pier", 6}}, "heavier(bags(log), 3.5)")
	check.Equal(slices.Collect(take(bags(log), 2)), []Bag{{"North", 3.5}, {"South", 1.25}}, "take(bags(log), 2)")

	scaleA := slices.Values([]float64{3.5, 1.25, 6})
	scaleB := slices.Values([]float64{3.25, 1.5})
	check.Equal(differences(scaleA, scaleB), []float64{0.25, -0.25}, "differences of the two example scales")
}
