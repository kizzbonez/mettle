package main

import (
	"errors"
	"time"
)

// ErrFull means the day already has as many tunings as the limit allows.
var ErrFull = errors.New("that day is fully booked")

// Diary is what the booker needs from a diary.
// Task 1: give it the two methods from the instructions.
type Diary interface {
}

// Notifier tells a customer something.
// Task 1: give it the one method from the instructions.
type Notifier interface {
}

// NotifyFunc lets an ordinary function be a Notifier.
// Task 2: give it the method that makes it one.
type NotifyFunc func(customer, message string) error

// Booker books tunings into a diary and confirms them to the customer.
// Task 3: give it the fields it needs.
type Booker struct {
}

// Option changes a Booker while NewBooker builds it.
type Option func(*Booker)

// WithDailyLimit sets how many tunings a day may hold. A limit below 1 is
// ignored.
func WithDailyLimit(n int) Option {
	panic("not implemented")
}

// WithSignOff sets the words that end every confirmation.
func WithSignOff(s string) Option {
	panic("not implemented")
}

// NewBooker returns a Booker that writes to diary and confirms through
// notifier: three tunings a day, signed "Ivy", unless options say otherwise.
func NewBooker(diary Diary, notifier Notifier, opts ...Option) *Booker {
	panic("not implemented")
}

// Book writes a tuning for customer on day into the diary, if the day has
// room, and then confirms it to the customer.
func (b *Booker) Book(customer string, day time.Time) error {
	panic("not implemented")
}
