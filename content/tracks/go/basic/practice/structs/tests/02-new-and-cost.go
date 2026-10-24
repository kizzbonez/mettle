func Test(t *testing.T) {
	check.Equal(newBooking("Cy", 3), Booking{Name: "Cy", Courts: 3, Hours: 1}, "a booking of three courts")
	check.Equal(newBooking("  Dee Lane\t", 1).Name, "Dee Lane", "newBooking removes the spaces around the name only")
	check.Equal(newBooking("Eli", 0).Courts, 1, "a booking of zero courts gets one court")
	check.Equal(newBooking("Eli", -4).Courts, 1, "a booking of a negative number of courts gets one court")
	check.Equal(newBooking("Eli", 2).Hours, 1, "a new booking is for one hour")
	check.Equal(newBooking("Eli", 2).Paid, false, "a new booking is not paid")

	check.Equal(cost(Booking{Courts: 1, Hours: 1}), 1500, "cost of one court for one hour")
	check.Equal(cost(Booking{Courts: 1, Hours: 2}), 2300, "cost of one court for two hours")
	check.Equal(cost(Booking{Courts: 4, Hours: 1}), 6000, "cost of four courts for one hour")
	check.Equal(cost(Booking{Courts: 3, Hours: 5}), 14100, "cost of three courts for five hours")
	check.Equal(cost(Booking{Name: "Fay", Courts: 2, Hours: 2, Paid: true}), 4600, "cost does not depend on the name or on being paid")
}
