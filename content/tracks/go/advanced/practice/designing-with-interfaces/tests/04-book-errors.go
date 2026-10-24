import (
	"errors"
	"time"
)

// testFaultyDiary records the calls it gets and fails when told to.
type testFaultyDiary struct {
	booked            int
	bookedErr, addErr error
	calls             []string
}

func (d *testFaultyDiary) Booked(day time.Time) (int, error) {
	d.calls = append(d.calls, "Booked "+day.Format("Mon 2 Jan"))
	return d.booked, d.bookedErr
}

func (d *testFaultyDiary) Add(day time.Time, customer string) error {
	d.calls = append(d.calls, "Add "+day.Format("Mon 2 Jan")+" "+customer)
	return d.addErr
}

// testFaultyNotifier records whom it was asked to tell, and fails when told to.
type testFaultyNotifier struct {
	err  error
	told []string
}

func (n *testFaultyNotifier) Notify(customer, message string) error {
	n.told = append(n.told, customer)
	return n.err
}

func Test(t *testing.T) {
	saturday := time.Date(2026, time.November, 7, 0, 0, 0, 0, time.UTC)
	errOffline := errors.New("diary app offline")
	errNoSignal := errors.New("no signal")

	diary := &testFaultyDiary{booked: 1}
	notes := &testFaultyNotifier{}
	check.NoError(NewBooker(diary, notes).Book("Mrs Okafor", saturday), "Book on a day with room")
	check.Equal(diary.calls, []string{"Booked Sat 7 Nov", "Add Sat 7 Nov Mrs Okafor"}, "Book asks the diary first, then adds the tuning")
	check.Equal(notes.told, []string{"Mrs Okafor"}, "Book tells the customer once the tuning is written")

	diary = &testFaultyDiary{bookedErr: errOffline}
	notes = &testFaultyNotifier{}
	err := NewBooker(diary, notes).Book("Mr Lee", saturday)
	check.ErrorIs(err, errOffline, "a failing Booked: Book wraps the diary's error")
	check.Equal(err.Error(), "reading the diary: diary app offline", "the message when Booked fails")
	check.Equal(diary.calls, []string{"Booked Sat 7 Nov"}, "a failing Booked: nothing is added")
	check.Equal(len(notes.told), 0, "a failing Booked: nobody is told")

	diary = &testFaultyDiary{booked: 3}
	notes = &testFaultyNotifier{}
	err = NewBooker(diary, notes).Book("Dr Haas", saturday)
	check.ErrorIs(err, ErrFull, "a day at the limit returns ErrFull")
	check.Equal(err.Error(), "Sat 7 Nov: that day is fully booked", "the message for a full Saturday")
	check.Equal(diary.calls, []string{"Booked Sat 7 Nov"}, "a full day: nothing is added")
	check.Equal(len(notes.told), 0, "a full day: nobody is told")

	diary = &testFaultyDiary{booked: 7}
	err = NewBooker(diary, &testFaultyNotifier{}, WithDailyLimit(5)).Book("Dr Haas", saturday)
	check.ErrorIs(err, ErrFull, "a day already over the limit returns ErrFull")

	diary = &testFaultyDiary{addErr: errOffline}
	notes = &testFaultyNotifier{}
	err = NewBooker(diary, notes).Book("Ms Ruiz", saturday)
	check.ErrorIs(err, errOffline, "a failing Add: Book wraps the diary's error")
	check.Equal(err.Error(), "writing the diary: diary app offline", "the message when Add fails")
	check.Equal(len(notes.told), 0, "a failing Add: nobody is told about a tuning that was not written")

	diary = &testFaultyDiary{}
	notes = &testFaultyNotifier{err: errNoSignal}
	err = NewBooker(diary, notes).Book("Mr Ito", saturday)
	check.ErrorIs(err, errNoSignal, "a failing Notify: Book wraps the notifier's error")
	check.Equal(err.Error(), "booked, but could not tell Mr Ito: no signal", "the message when Notify fails")
	check.Equal(diary.calls, []string{"Booked Sat 7 Nov", "Add Sat 7 Nov Mr Ito"}, "a failing Notify: the tuning is still written")
}
