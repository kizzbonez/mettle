import (
	"errors"
	"fmt"
)

func Test(t *testing.T) {
	check.Equal(reply(nil), "booked", "reply for no error")

	var d Diary
	check.NoError(d.Add(Booking{Name: "Brownies", Day: "Thu", Start: 9, Hours: 2}), "adding the Brownies at 09:00")

	clash := fmt.Errorf("phone line 2: %w", d.Add(Booking{Name: "Art", Day: "Thu", Start: 10, Hours: 1}))
	check.Equal(reply(clash), "taken by Brownies from 09:00", "reply for a clash wrapped again by another layer")

	closed := fmt.Errorf("web form: %w", d.Add(Booking{Name: "Quiz", Day: "Sun", Start: 19, Hours: 3}))
	check.Equal(reply(closed), "sorry, the hall is closed that day", "reply for a Sunday booking wrapped again")

	fields := fmt.Errorf("web form: %w", d.Add(Booking{Name: "Art", Day: "Fri", Start: 7, Hours: 9}))
	check.Equal(reply(fields), "please check the start", "reply for a booking whose first problem is the start")

	check.Equal(reply(errors.New("printer jam")), "something went wrong", "reply for an unrelated error")
	check.Equal(reply(fmt.Errorf("desk: %w", ErrClosed)), "sorry, the hall is closed that day", "reply for ErrClosed wrapped once")

	both := errors.Join(&FieldError{Field: "hours", Problem: "must be from 1 to 4"}, &ClashError{With: "Choir", Day: "Tue", Start: 18})
	check.Equal(reply(both), "taken by Choir from 18:00", "a clash is reported before a field error")
	all := errors.Join(&ClashError{With: "Choir", Day: "Tue", Start: 18}, fmt.Errorf("x: %w", ErrClosed))
	check.Equal(reply(all), "sorry, the hall is closed that day", "a closed day is reported before a clash")
}
