func Test(t *testing.T) {
	day := []Booking{
		newBooking(" Ada ", 2),
		{Name: "Bo", Courts: 1, Hours: 3},
		{Name: "ada", Courts: 1, Hours: 2, Paid: true},
	}
	check.Equal(day[0], Booking{Name: "Ada", Courts: 2, Hours: 1}, `newBooking(" Ada ", 2)`)
	check.Equal(cost(day[0]), 3000, "cost of two courts for one hour")
	check.Equal(cost(day[1]), 3100, "cost of one court for three hours")
	check.Equal(owed(day), map[string]Tally{"ada": {Bookings: 1, Cents: 3000}, "bo": {Bookings: 1, Cents: 3100}}, "owed(day) before anyone pays")
	check.Equal(payAll(day, "ADA"), 1, `payAll(day, "ADA")`)
	check.True(day[0].Paid, `day[0] is paid after payAll(day, "ADA")`)
	check.Equal(owed(day), map[string]Tally{"bo": {Bookings: 1, Cents: 3100}}, "owed(day) after Ada pays")
}
