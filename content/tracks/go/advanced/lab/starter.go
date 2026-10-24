package main

import (
	"context"
	"errors"
	"time"
)

var (
	// ErrNoAnswer is the error of a call that ran past Config.Timeout.
	ErrNoAnswer = errors.New("no answer")
	// ErrBusy is what a catalogue returns, possibly wrapped, when it asks to be called again later.
	ErrBusy = errors.New("catalogue busy")
	// ErrConfig wraps every problem with a Config.
	ErrConfig = errors.New("bad config")
)

// A Catalogue says how many copies of a book one branch has on its shelves.
// Count must return soon after ctx is done.
type Catalogue interface {
	Count(ctx context.Context, branch, isbn string) (int, error)
}

// CatalogueFunc lets an ordinary function be a Catalogue.
type CatalogueFunc func(ctx context.Context, branch, isbn string) (int, error)

// Count calls f.
func (f CatalogueFunc) Count(ctx context.Context, branch, isbn string) (int, error) {
	return f(ctx, branch, isbn)
}

// Config controls one stock check.
type Config struct {
	Workers  int           // branches checked at once, at least 1
	Timeout  time.Duration // limit for one call, more than 0
	Attempts int           // calls per branch at most, at least 1
	Backoff  time.Duration // wait before the second call, doubled before each later one; 0 or more
}

// Result is what one branch said.
type Result struct {
	Branch   string
	Copies   int
	Attempts int   // calls made
	Err      error // nil when the branch answered
}

// Counts sorts the finished branches into three piles.
type Counts struct {
	InStock  int // answered with at least one copy
	NoCopies int // answered with none
	Failed   int // never answered, or answered with an error
}

// Tally counts finished branches while a check runs. It must be safe for
// concurrent use, and its zero value must be ready to use. Give it the
// fields it needs.
type Tally struct {
}

// Add counts one finished branch.
func (t *Tally) Add(r Result) {
	panic("not implemented")
}

// Counts returns the counts so far.
func (t *Tally) Counts() Counts {
	panic("not implemented")
}

// StockCheck asks every branch's catalogue how many copies of isbn it has,
// with at most cfg.Workers branches at once, and returns the results in
// the order of branches. Each finished branch is added to tally, if it is
// not nil, as soon as it is finished. If ctx is done first, StockCheck
// stops every call and wait, and returns context.Cause(ctx).
func StockCheck(ctx context.Context, cat Catalogue, isbn string, branches []string, cfg Config, tally *Tally) ([]Result, error) {
	panic("not implemented")
}

// Report describes the results, one line per branch and a total.
func Report(results []Result) string {
	panic("not implemented")
}
