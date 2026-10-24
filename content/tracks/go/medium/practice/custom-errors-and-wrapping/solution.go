package main

import (
	"errors"
	"fmt"
	"strings"
)

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

func (e *FieldError) Error() string {
	return e.Field + " " + e.Problem
}

// ClashError reports that a booking overlaps one already in the diary.
type ClashError struct {
	With  string // the name of the booking already in the diary
	Day   string
	Start int // the start hour of the booking already in the diary
}

func (e *ClashError) Error() string {
	return fmt.Sprintf("clashes with %s on %s at %02d:00", e.With, e.Day, e.Start)
}

// validate reports every problem with b at once, or nil when there is none.
func validate(b Booking) error {
	var errs []error
	if strings.TrimSpace(b.Name) == "" {
		errs = append(errs, &FieldError{Field: "name", Problem: "is empty"})
	}
	if b.Start < 9 || b.Start > 21 {
		errs = append(errs, &FieldError{Field: "start", Problem: "must be from 9 to 21"})
	}
	if b.Hours < 1 || b.Hours > 4 {
		errs = append(errs, &FieldError{Field: "hours", Problem: "must be from 1 to 4"})
	}
	return errors.Join(errs...)
}

// Diary holds the bookings the hall has accepted.
type Diary struct {
	bookings []Booking
}

// Add accepts b, or explains why it cannot. A rejected booking is not stored.
func (d *Diary) Add(b Booking) error {
	if err := validate(b); err != nil {
		return fmt.Errorf("booking %q: %w", b.Name, err)
	}
	if b.Day == "Sun" {
		return fmt.Errorf("booking %q on %s: %w", b.Name, b.Day, ErrClosed)
	}
	for _, old := range d.bookings {
		// Hours are half-open ranges: a booking that ends at 20:00 does not
		// clash with one that starts at 20:00.
		if old.Day == b.Day && b.Start < old.Start+old.Hours && old.Start < b.Start+b.Hours {
			return fmt.Errorf("booking %q: %w", b.Name, &ClashError{With: old.Name, Day: old.Day, Start: old.Start})
		}
	}
	d.bookings = append(d.bookings, b)
	return nil
}

// reply turns the result of Add into the sentence the front desk reads out.
// It searches the whole error tree, so it also works on errors wrapped again.
func reply(err error) string {
	if err == nil {
		return "booked"
	}
	if errors.Is(err, ErrClosed) {
		return "sorry, the hall is closed that day"
	}
	if ce, ok := errors.AsType[*ClashError](err); ok {
		return fmt.Sprintf("taken by %s from %02d:00", ce.With, ce.Start)
	}
	if fe, ok := errors.AsType[*FieldError](err); ok {
		return "please check the " + fe.Field
	}
	return "something went wrong"
}
