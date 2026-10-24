func Test(t *testing.T) {
	ts := []Trip{
		{Minute: 11*60 + 15, Boat: "Otter"},
		{Minute: 10*60 + 45, Boat: "Heron"},
		{Minute: 11*60 + 15, Boat: "Heron"},
		{Minute: 12 * 60, Boat: "Otter"},
	}
	sortTrips(ts)
	check.Equal(ts, []Trip{{645, "Heron"}, {675, "Heron"}, {675, "Otter"}, {720, "Otter"}}, "the example board after sortTrips")

	trip, ok := nextTrip(ts, 11*60)
	check.True(ok, "nextTrip at 11:00 finds a trip")
	check.Equal(trip, Trip{675, "Heron"}, "the next trip at 11:00")
	trip, ok = nextTrip(ts, 11*60+15)
	check.True(ok, "nextTrip at 11:15 finds a trip")
	check.Equal(trip, Trip{675, "Heron"}, "the next trip at 11:15, when two boats leave at that minute")
	trip, ok = nextTrip(ts, 12*60+1)
	check.True(!ok, "nextTrip after the last boat reports false")
	check.Equal(trip, Trip{}, "the trip returned after the last boat")

	ts = addTrip(ts, Trip{Minute: 11 * 60, Boat: "Kingfisher"})
	check.Equal(ts, []Trip{{645, "Heron"}, {660, "Kingfisher"}, {675, "Heron"}, {675, "Otter"}, {720, "Otter"}}, "the board after adding the 11:00 Kingfisher")
	ts = addTrip(ts, Trip{Minute: 11 * 60, Boat: "Kingfisher"})
	check.Equal(len(ts), 5, "adding a trip that is already there changes nothing")

	check.Equal(boats(ts), []string{"Heron", "Kingfisher", "Otter"}, "the boats of the example board")
}
