import "errors"

func Test(t *testing.T) {
	check.Equal(ErrSlotTaken.Error(), "slot is already taken", "the text of ErrSlotTaken")
	check.Equal(ErrBadSlot.Error(), "not a valid slot", "the text of ErrBadSlot")

	b := NewBookings()
	for _, bad := range []string{"", "tomorrow", "2026-11-03", "2026-13-03 18:00", "2026-11-03 25:00", "03/11/2026 18:00"} {
		err := b.Book(bad, "dee")
		check.ErrorIs(err, ErrBadSlot, "Book refuses a slot that is not a day and a time")
	}
	check.True(!b.IsBooked("0001-01-01 00:00"), "a bad slot is never booked as the zero time")
	err := b.Book("tomorrow", "dee")
	check.Equal(err.Error(), "book tomorrow: not a valid slot", "the error text for a bad slot")

	check.NoError(b.Book("2026-11-05 09:00", "eli"), "booking a free slot")
	err = b.Book("2026-11-05 09:00", "fay")
	check.ErrorIs(err, ErrSlotTaken, "the error for a taken slot wraps ErrSlotTaken (%w, not %v)")
	check.True(!errors.Is(err, ErrBadSlot), "a taken slot is not reported as a bad slot")
	check.Equal(b.Member("2026-11-05 09:00"), "eli", "a taken slot keeps its first member")

	check.Equal(LabAddress("192.168.4.20", 9000), "192.168.4.20:9000", "LabAddress of an IPv4 address")
	check.Equal(LabAddress("enlarger.local", 80), "enlarger.local:80", "LabAddress of a host name")
	check.Equal(LabAddress("fe80::1ff:fe23:4567:890a", 9000), "[fe80::1ff:fe23:4567:890a]:9000", "LabAddress of an IPv6 address")
}
