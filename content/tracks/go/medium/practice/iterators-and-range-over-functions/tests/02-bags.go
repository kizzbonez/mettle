import "slices"

func Test(t *testing.T) {
	log := "  East   2.5  \nWest 1.5\r\nDunes 3 extra\nRocks\nPier -2\nPier 0.0\n\n   \nCove 4.75"
	want := []Bag{{"East", 2.5}, {"West", 1.5}, {"Cove", 4.75}}
	check.Equal(slices.Collect(bags(log)), want, "the valid bags of a log with spaces, a Windows line ending, bad lines and no final newline")

	seq := bags(log)
	check.Equal(slices.Collect(seq), slices.Collect(seq), "ranging twice over the same iterator gives the same bags")

	var first []Bag
	for b := range bags(log) {
		first = append(first, b)
		break
	}
	check.Equal(first, []Bag{{"East", 2.5}}, "a loop that breaks after the first bag")

	var two []Bag
	for b := range bags(log) {
		two = append(two, b)
		if len(two) == 2 {
			break
		}
	}
	check.Equal(two, []Bag{{"East", 2.5}, {"West", 1.5}}, "a loop that breaks after the second bag")

	check.Equal(slices.Collect(bags("")), []Bag{}, "an empty log has no bags")
	check.Equal(slices.Collect(bags("Rocks\nDunes two\n")), []Bag{}, "a log with no valid line has no bags")
}
