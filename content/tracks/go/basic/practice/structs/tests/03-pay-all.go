func Test(t *testing.T) {
	day := []Booking{
		{Name: "Gus", Courts: 1, Hours: 1},
		{Name: "Hal", Courts: 2, Hours: 2},
		{Name: "gus", Courts: 3, Hours: 1},
		{Name: "GUS", Courts: 1, Hours: 4, Paid: true},
		{Name: "Gussie", Courts: 1, Hours: 1},
	}
	check.Equal(payAll(day, "Gus"), 2, "the number of unpaid bookings payAll changed")
	check.Equal(day[0].Paid, true, "the first matching booking in the slice is paid")
	check.Equal(day[2].Paid, true, "a matching booking with the name in another case is paid")
	check.Equal(day[1].Paid, false, "another person's booking is left unpaid")
	check.Equal(day[4].Paid, false, "a name that only starts with the same letters is left unpaid")
	check.Equal(day[0], Booking{Name: "Gus", Courts: 1, Hours: 1, Paid: true}, "payAll changes nothing but Paid")
	check.Equal(payAll(day, "gus"), 0, "paying again changes nothing")
	check.Equal(payAll(day, "Ivy"), 0, "paying for someone with no bookings changes nothing")
	check.Equal(payAll(nil, "Gus"), 0, "paying with no bookings at all")
}
