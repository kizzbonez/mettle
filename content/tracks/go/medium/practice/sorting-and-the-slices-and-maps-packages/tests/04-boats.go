import "slices"

func Test(t *testing.T) {
	ts := []Trip{{1020, "Otter"}, {600, "Swan"}, {735, "Heron"}, {690, "Otter"}, {600, "Kingfisher"}, {960, "Heron"}, {1050, "Otter"}}
	before := slices.Clone(ts)
	check.Equal(boats(ts), []string{"Heron", "Kingfisher", "Otter", "Swan"}, "the boats of an unsorted board, each once")
	check.Equal(ts, before, "boats leaves the board it was given unchanged")

	check.Equal(boats([]Trip{{600, "Heron"}, {700, "Heron"}, {800, "Heron"}}), []string{"Heron"}, "a board with one boat")
	check.Equal(boats(nil), []string{}, "the boats of an empty board")

	sorted := []Trip{{600, "Heron"}, {600, "Otter"}, {690, "Heron"}}
	check.Equal(boats(sorted), []string{"Heron", "Otter"}, "the boats of a sorted board whose boats repeat apart")
	check.Equal(sorted, []Trip{{600, "Heron"}, {600, "Otter"}, {690, "Heron"}}, "boats leaves a sorted board unchanged")
}
