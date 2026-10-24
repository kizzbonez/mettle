func Test(t *testing.T) {
	ties := []Trip{{600, "Wren"}, {600, "Coot"}, {600, "Avocet"}, {600, "Bittern"}}
	sortTrips(ties)
	check.Equal(ties, []Trip{{600, "Avocet"}, {600, "Bittern"}, {600, "Coot"}, {600, "Wren"}}, "four boats at the same minute, sorted by boat")

	day := []Trip{
		{1020, "Otter"}, {600, "Kingfisher"}, {1020, "Heron"}, {735, "Otter"}, {600, "Heron"}, {1080, "Swan"},
		{690, "Kingfisher"}, {735, "Heron"}, {1020, "Kingfisher"}, {570, "Swan"}, {690, "Heron"}, {960, "Otter"},
		{1050, "Kingfisher"}, {600, "Otter"},
	}
	sortTrips(day)
	want := []Trip{
		{570, "Swan"}, {600, "Heron"}, {600, "Kingfisher"}, {600, "Otter"}, {690, "Heron"}, {690, "Kingfisher"},
		{735, "Heron"}, {735, "Otter"}, {960, "Otter"}, {1020, "Heron"}, {1020, "Kingfisher"}, {1020, "Otter"},
		{1050, "Kingfisher"}, {1080, "Swan"},
	}
	check.Equal(day, want, "a whole day of fourteen trips, sorted")

	one := []Trip{{700, "Heron"}}
	sortTrips(one)
	check.Equal(one, []Trip{{700, "Heron"}}, "a board with one trip")
	var none []Trip
	sortTrips(none)
	check.Equal(len(none), 0, "an empty board")
}
