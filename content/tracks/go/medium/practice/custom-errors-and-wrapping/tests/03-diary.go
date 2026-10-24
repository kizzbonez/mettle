import "errors"

func Test(t *testing.T) {
	var d Diary
	check.NoError(d.Add(Booking{Name: "Choir", Day: "Tue", Start: 18, Hours: 2}), "adding the first booking")

	err := d.Add(Booking{Name: "", Day: "Tue", Start: 10, Hours: 1})
	check.Equal(err.Error(), `booking "": name is empty`, "the message for a booking without a name")
	_, ok := errors.AsType[*FieldError](err)
	check.True(ok, "the *FieldError can still be found inside Add's error")

	err = d.Add(Booking{Name: "Quiz", Day: "Sun", Start: 19, Hours: 3})
	check.Equal(err.Error(), `booking "Quiz" on Sun: hall closed`, "the message for a Sunday booking")
	check.ErrorIs(err, ErrClosed, "a Sunday booking's error wraps ErrClosed")

	err = d.Add(Booking{Name: "Quiz", Day: "Sun", Start: 23, Hours: 3})
	check.True(!errors.Is(err, ErrClosed), "an invalid Sunday booking is refused by validate before the day is checked")

	err = d.Add(Booking{Name: "Chess", Day: "Tue", Start: 17, Hours: 4})
	clash := check.ErrorAs[*ClashError](err, "a booking that covers the choir's hours")
	check.Equal(*clash, ClashError{With: "Choir", Day: "Tue", Start: 18}, "the ClashError describes the booking already in the diary")
	check.Equal(err.Error(), `booking "Chess": clashes with Choir on Tue at 18:00`, "the message for a clash")
	check.ErrorAs[*ClashError](d.Add(Booking{Name: "Chess", Day: "Tue", Start: 19, Hours: 1}), "a booking inside the choir's hours")
	check.ErrorAs[*ClashError](d.Add(Booking{Name: "Chess", Day: "Tue", Start: 17, Hours: 2}), "a booking that ends during the choir")

	check.NoError(d.Add(Booking{Name: "Toddlers", Day: "Tue", Start: 16, Hours: 2}), "a booking that ends as the choir starts")
	check.NoError(d.Add(Booking{Name: "Darts", Day: "Tue", Start: 20, Hours: 2}), "a booking that starts as the choir ends")
	check.NoError(d.Add(Booking{Name: "Ceilidh", Day: "Sat", Start: 18, Hours: 4}), "a booking at the same hours on another day")
	check.Equal(len(d.bookings), 4, "only accepted bookings are stored")
}
