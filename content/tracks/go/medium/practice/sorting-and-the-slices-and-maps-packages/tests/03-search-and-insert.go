func Test(t *testing.T) {
	ts := []Trip{{600, "Heron"}, {600, "Kingfisher"}, {690, "Kingfisher"}, {735, "Heron"}, {735, "Otter"}, {1080, "Swan"}}

	cases := []struct {
		now  int
		want Trip
	}{
		{0, Trip{600, "Heron"}},
		{600, Trip{600, "Heron"}},
		{601, Trip{690, "Kingfisher"}},
		{700, Trip{735, "Heron"}},
		{735, Trip{735, "Heron"}},
		{1079, Trip{1080, "Swan"}},
		{1080, Trip{1080, "Swan"}},
	}
	for _, c := range cases {
		got, ok := nextTrip(ts, c.now)
		check.True(ok, "nextTrip finds a trip before the last one has gone")
		check.Equal(got, c.want, "the next trip at or after a given minute")
	}
	_, ok := nextTrip(ts, 1081)
	check.True(!ok, "nextTrip one minute after the last boat")
	_, ok = nextTrip(nil, 600)
	check.True(!ok, "nextTrip on an empty board")

	var board []Trip
	board = addTrip(board, Trip{720, "Otter"})
	board = addTrip(board, Trip{540, "Swan"})
	board = addTrip(board, Trip{900, "Kingfisher"})
	board = addTrip(board, Trip{720, "Heron"})
	board = addTrip(board, Trip{720, "Puffin"})
	want := []Trip{{540, "Swan"}, {720, "Heron"}, {720, "Otter"}, {720, "Puffin"}, {900, "Kingfisher"}}
	check.Equal(board, want, "five trips added one by one, in order")

	board = addTrip(board, Trip{720, "Otter"})
	board = addTrip(board, Trip{900, "Kingfisher"})
	check.Equal(board, want, "adding trips that are already there")
	board = addTrip(board, Trip{900, "Heron"})
	check.Equal(board[4], Trip{900, "Heron"}, "a new boat at a minute that already has a trip goes in boat order")
}
