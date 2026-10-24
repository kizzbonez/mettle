import (
	"errors"
	"time"
)

// testExampleDiary keeps the tunings of each day in memory.
type testExampleDiary struct{ days map[string][]string }

func (d *testExampleDiary) Booked(day time.Time) (int, error) {
	return len(d.days[day.Format(time.DateOnly)]), nil
}

func (d *testExampleDiary) Add(day time.Time, customer string) error {
	key := day.Format(time.DateOnly)
	d.days[key] = append(d.days[key], customer)
	return nil
}

func Test(t *testing.T) {
	diary := &testExampleDiary{days: map[string][]string{}}
	var sent []string
	texts := NotifyFunc(func(customer, message string) error {
		sent = append(sent, customer+": "+message)
		return nil
	})
	friday := time.Date(2026, time.November, 6, 0, 0, 0, 0, time.UTC)

	b := NewBooker(diary, texts, WithDailyLimit(2), WithSignOff("Ivy, the valley piano tuner"))
	check.NoError(b.Book("Mrs Okafor", friday), `b.Book("Mrs Okafor", friday)`)
	check.NoError(b.Book("Mr Lee", friday), `b.Book("Mr Lee", friday)`)
	err := b.Book("Dr Haas", friday)
	check.True(errors.Is(err, ErrFull), `b.Book("Dr Haas", friday) on a full day returns ErrFull`)
	check.Equal(err.Error(), "Fri 6 Nov: that day is fully booked", "the error for a full Friday")

	check.Equal(diary.days["2026-11-06"], []string{"Mrs Okafor", "Mr Lee"}, "the tunings written into the diary for Friday")
	check.Equal(sent, []string{
		"Mrs Okafor: Your piano tuning is booked for Fri 6 Nov. Ivy, the valley piano tuner",
		"Mr Lee: Your piano tuning is booked for Fri 6 Nov. Ivy, the valley piano tuner",
	}, "the confirmations sent through the NotifyFunc")
}
