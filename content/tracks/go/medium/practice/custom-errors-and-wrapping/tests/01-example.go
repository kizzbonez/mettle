func Test(t *testing.T) {
	var d Diary
	check.NoError(d.Add(Booking{Name: "Choir", Day: "Tue", Start: 18, Hours: 2}), "adding the choir on Tuesday at 18:00")
	check.NoError(d.Add(Booking{Name: "Yoga", Day: "Tue", Start: 20, Hours: 1}), "adding yoga at 20:00, as the choir ends")

	err := d.Add(Booking{Name: "Chess", Day: "Tue", Start: 19, Hours: 2})
	check.Error(err, "adding chess at 19:00, during the choir")
	check.Equal(err.Error(), `booking "Chess": clashes with Choir on Tue at 18:00`, "the message for the chess clash")
	check.Equal(reply(err), "taken by Choir from 18:00", "reply for the chess clash")

	err = d.Add(Booking{Name: " ", Day: "Wed", Start: 8, Hours: 2})
	check.Error(err, "adding a booking with a blank name at 08:00")
	check.Equal(err.Error(), "booking \" \": name is empty\nstart must be from 9 to 21", "the message for a blank name and an early start")
	check.Equal(reply(err), "please check the name", "reply for a blank name and an early start")

	check.Equal(reply(d.Add(Booking{Name: "Quiz", Day: "Sun", Start: 19, Hours: 3})), "sorry, the hall is closed that day", "reply for a Sunday booking")
	check.Equal(len(d.bookings), 2, "the number of bookings stored after two were accepted")
}
