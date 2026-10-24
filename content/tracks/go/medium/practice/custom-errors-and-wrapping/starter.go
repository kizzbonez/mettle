package main

// Add "fmt" and "strings" to the imports when your code uses them.
import "errors"

// Booking is one request to hire the hall.
type Booking struct {
	Name  string // who is hiring the hall, such as "Choir"
	Day   string // "Mon" to "Sun"
	Start int    // the starting hour, 0 to 23
	Hours int    // the length in whole hours
}

// ErrClosed means that the hall does not open on the day asked for.
var ErrClosed = errors.New("hall closed")

// FieldError reports one field of a booking that is not valid.
type FieldError struct {
	Field   string
	Problem string
}

// Task 1: return the field, a space, and the problem.
func (e *FieldError) Error() string {
	panic("not implemented")
}

// ClashError reports that a booking overlaps one already in the diary.
type ClashError struct {
	With  string // the name of the booking already in the diary
	Day   string
	Start int // the start hour of the booking already in the diary
}

// Task 1: return a message such as "clashes with Choir on Tue at 18:00".
func (e *ClashError) Error() string {
	panic("not implemented")
}

// Task 2: report every problem with b at once, or nil when there is none.
func validate(b Booking) error {
	panic("not implemented")
}

// Diary holds the bookings the hall has accepted.
type Diary struct {
	bookings []Booking
}

// Task 3: accept b, or explain why it cannot. A rejected booking is not stored.
func (d *Diary) Add(b Booking) error {
	panic("not implemented")
}

// Task 4: turn the result of Add into the sentence the front desk reads out.
func reply(err error) string {
	panic("not implemented")
}
