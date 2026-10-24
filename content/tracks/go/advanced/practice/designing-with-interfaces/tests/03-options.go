import "time"

// testOptionsDiary keeps one count per day.
type testOptionsDiary struct{ counts map[time.Time]int }

func (d *testOptionsDiary) Booked(day time.Time) (int, error) { return d.counts[day], nil }

func (d *testOptionsDiary) Add(day time.Time, customer string) error {
	d.counts[day]++
	return nil
}

// testOptionsNotes keeps every message it is asked to send.
type testOptionsNotes struct{ messages []string }

func (n *testOptionsNotes) Notify(customer, message string) error {
	n.messages = append(n.messages, message)
	return nil
}

func Test(t *testing.T) {
	monday := time.Date(2026, time.November, 9, 0, 0, 0, 0, time.UTC)
	// fits books customers on monday until the first error and says how many fitted.
	fits := func(b *Booker) int {
		for n := range 10 {
			if b.Book("customer", monday) != nil {
				return n
			}
		}
		return 10
	}
	newDiary := func() *testOptionsDiary { return &testOptionsDiary{counts: map[time.Time]int{}} }

	notes := &testOptionsNotes{}
	check.Equal(fits(NewBooker(newDiary(), notes)), 3, "tunings that fit on a day with no options: the default limit")
	check.Equal(notes.messages[0], "Your piano tuning is booked for Mon 9 Nov. Ivy", "the confirmation with the default sign-off")

	check.Equal(fits(NewBooker(newDiary(), notes, WithDailyLimit(1))), 1, "tunings that fit with WithDailyLimit(1)")
	check.Equal(fits(NewBooker(newDiary(), notes, WithDailyLimit(5))), 5, "tunings that fit with WithDailyLimit(5)")
	check.Equal(fits(NewBooker(newDiary(), notes, WithDailyLimit(0))), 3, "WithDailyLimit(0) is ignored and keeps the default")
	check.Equal(fits(NewBooker(newDiary(), notes, WithDailyLimit(-2))), 3, "WithDailyLimit(-2) is ignored and keeps the default")
	check.Equal(fits(NewBooker(newDiary(), notes, WithDailyLimit(5), WithDailyLimit(2))), 2, "the later of two WithDailyLimit options wins")
	check.Equal(fits(NewBooker(newDiary(), notes, WithDailyLimit(2), WithDailyLimit(0))), 2, "an ignored WithDailyLimit keeps the limit an earlier option set")

	signed := &testOptionsNotes{}
	b := NewBooker(newDiary(), signed, WithSignOff("Ivy (07700 900123)"), WithDailyLimit(4))
	check.NoError(b.Book("Mrs Okafor", monday), "Book with a sign-off and a limit")
	check.Equal(signed.messages, []string{"Your piano tuning is booked for Mon 9 Nov. Ivy (07700 900123)"}, "the confirmation with WithSignOff")
	twice := &testOptionsNotes{}
	b = NewBooker(newDiary(), twice, WithSignOff("first"), WithSignOff("second"))
	check.NoError(b.Book("Mr Lee", monday), "Book with two sign-offs")
	check.Equal(twice.messages, []string{"Your piano tuning is booked for Mon 9 Nov. second"}, "the later of two WithSignOff options wins")
}
