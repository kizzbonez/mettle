func Test(t *testing.T) {
	day := []Booking{
		{Name: "Jo", Courts: 1, Hours: 2},
		{Name: "Kai", Courts: 2, Hours: 1, Paid: true},
		{Name: "JO", Courts: 2, Hours: 3},
		{Name: "Lu", Courts: 1, Hours: 1},
		{Name: "jo", Courts: 1, Hours: 1, Paid: true},
	}
	want := map[string]Tally{
		"jo": {Bookings: 2, Cents: 2300 + 6200},
		"lu": {Bookings: 1, Cents: 1500},
	}
	got := owed(day)
	check.Equal(got, want, "owed totals each person's unpaid bookings under the lower-case name")
	_, kai := got["kai"]
	check.Equal(kai, false, "someone whose bookings are all paid has no entry")
	check.True(day[1].Paid && !day[0].Paid, "owed leaves the bookings unchanged")
	check.Equal(len(owed(nil)), 0, "nobody owes anything when there are no bookings")
}
