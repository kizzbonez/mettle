import "errors"

func Test(t *testing.T) {
	b := NewBookings()
	check.NoError(b.Book("2026-11-03 18:00", " ada "), `b.Book("2026-11-03 18:00", " ada ")`)
	check.True(b.IsBooked("2026-11-03 18:00"), `b.IsBooked("2026-11-03 18:00") after booking it`)
	check.Equal(b.Member("2026-11-03 18:00"), "ada", `b.Member("2026-11-03 18:00"): the name without spaces`)

	err := b.Book("2026-11-03 18:00", "bo")
	check.ErrorIs(err, ErrSlotTaken, "booking a slot that is taken")
	check.Equal(err.Error(), "book 2026-11-03 18:00: slot is already taken", "the error text for a slot that is taken")

	err = b.Book("next tuesday", "bo")
	check.ErrorIs(err, ErrBadSlot, `booking the slot "next tuesday"`)
	check.True(!errors.Is(err, ErrSlotTaken), "a bad slot is not reported as taken")

	check.Equal(LabAddress("::1", 8080), "[::1]:8080", `LabAddress("::1", 8080)`)
}
