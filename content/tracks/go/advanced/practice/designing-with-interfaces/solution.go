package main

import (
	"errors"
	"fmt"
	"time"
)

// ErrFull means the day already has as many tunings as the limit allows.
var ErrFull = errors.New("that day is fully booked")

// Diary is what the booker needs from a diary: how many tunings a day
// has, and a way to write one in.
type Diary interface {
	Booked(day time.Time) (int, error)
	Add(day time.Time, customer string) error
}

// Notifier tells a customer something.
type Notifier interface {
	Notify(customer, message string) error
}

// NotifyFunc lets an ordinary function be a Notifier.
type NotifyFunc func(customer, message string) error

// Notify calls f(customer, message).
func (f NotifyFunc) Notify(customer, message string) error { return f(customer, message) }

// Booker books tunings into a diary and confirms them to the customer.
type Booker struct {
	diary    Diary
	notifier Notifier
	limit    int
	signOff  string
}

// Option changes a Booker while NewBooker builds it.
type Option func(*Booker)

// WithDailyLimit sets how many tunings a day may hold. A limit below 1 is
// ignored.
func WithDailyLimit(n int) Option {
	return func(b *Booker) {
		if n >= 1 {
			b.limit = n
		}
	}
}

// WithSignOff sets the words that end every confirmation.
func WithSignOff(s string) Option {
	return func(b *Booker) { b.signOff = s }
}

// NewBooker returns a Booker that writes to diary and confirms through
// notifier: three tunings a day, signed "Ivy", unless options say otherwise.
func NewBooker(diary Diary, notifier Notifier, opts ...Option) *Booker {
	b := &Booker{diary: diary, notifier: notifier, limit: 3, signOff: "Ivy"}
	for _, opt := range opts {
		opt(b)
	}
	return b
}

// Book writes a tuning for customer on day into the diary, if the day has
// room, and then confirms it to the customer.
func (b *Booker) Book(customer string, day time.Time) error {
	booked, err := b.diary.Booked(day)
	if err != nil {
		return fmt.Errorf("reading the diary: %w", err)
	}
	if booked >= b.limit {
		return fmt.Errorf("%s: %w", day.Format("Mon 2 Jan"), ErrFull)
	}
	if err := b.diary.Add(day, customer); err != nil {
		return fmt.Errorf("writing the diary: %w", err)
	}
	message := fmt.Sprintf("Your piano tuning is booked for %s. %s", day.Format("Mon 2 Jan"), b.signOff)
	if err := b.notifier.Notify(customer, message); err != nil {
		// The booking stands; only the confirmation failed.
		return fmt.Errorf("booked, but could not tell %s: %w", customer, err)
	}
	return nil
}
