package main

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"sync"
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

// Tally counts finished branches while a check runs. It is safe for
// concurrent use, and its zero value is ready to use.
type Tally struct {
	mu     sync.Mutex
	counts Counts
}

// Add counts one finished branch.
func (t *Tally) Add(r Result) {
	t.mu.Lock()
	defer t.mu.Unlock()
	switch {
	case r.Err != nil:
		t.counts.Failed++
	case r.Copies > 0:
		t.counts.InStock++
	default:
		t.counts.NoCopies++
	}
}

// Counts returns the counts so far.
func (t *Tally) Counts() Counts {
	t.mu.Lock()
	defer t.mu.Unlock()
	return t.counts
}

func (c Config) validate() error {
	switch {
	case c.Workers < 1:
		return fmt.Errorf("%w: Workers is %d, want at least 1", ErrConfig, c.Workers)
	case c.Timeout <= 0:
		return fmt.Errorf("%w: Timeout is %v, want more than 0", ErrConfig, c.Timeout)
	case c.Attempts < 1:
		return fmt.Errorf("%w: Attempts is %d, want at least 1", ErrConfig, c.Attempts)
	case c.Backoff < 0:
		return fmt.Errorf("%w: Backoff is %v, want 0 or more", ErrConfig, c.Backoff)
	}
	return nil
}

// checker holds what every worker needs for one stock check.
type checker struct {
	cat  Catalogue
	isbn string
	cfg  Config
}

// call makes one call with its own time limit. A call whose limit passed
// is no answer, whatever Count returned.
func (c checker) call(ctx context.Context, branch string) (int, error) {
	callCtx, cancel := context.WithTimeout(ctx, c.cfg.Timeout)
	defer cancel()
	copies, err := c.cat.Count(callCtx, branch, c.isbn)
	if ctx.Err() == nil && errors.Is(callCtx.Err(), context.DeadlineExceeded) {
		return 0, ErrNoAnswer
	}
	return copies, err
}

// check calls one branch until it answers, fails for good, or runs out of
// attempts, waiting between calls. It stops as soon as ctx is done.
func (c checker) check(ctx context.Context, branch string) Result {
	r := Result{Branch: branch}
	wait := c.cfg.Backoff
	for {
		r.Attempts++
		copies, err := c.call(ctx, branch)
		r.Copies, r.Err = copies, err
		if err != nil {
			r.Copies = 0
		}
		retry := errors.Is(err, ErrBusy) || errors.Is(err, ErrNoAnswer)
		if !retry || r.Attempts == c.cfg.Attempts || ctx.Err() != nil {
			return r
		}
		if !pause(ctx, wait) {
			return r
		}
		wait *= 2
	}
}

// pause waits for d, and reports false if ctx was done first.
func pause(ctx context.Context, d time.Duration) bool {
	timer := time.NewTimer(d)
	defer timer.Stop()
	select {
	case <-timer.C:
		return true
	case <-ctx.Done():
		return false
	}
}

// StockCheck asks every branch's catalogue how many copies of isbn it has,
// with at most cfg.Workers branches at once, and returns the results in
// the order of branches. Each finished branch is added to tally, if it is
// not nil, as soon as it is finished. If ctx is done first, StockCheck
// stops every call and wait, and returns context.Cause(ctx).
func StockCheck(ctx context.Context, cat Catalogue, isbn string, branches []string, cfg Config, tally *Tally) ([]Result, error) {
	if err := cfg.validate(); err != nil {
		return nil, err
	}
	c := checker{cat: cat, isbn: isbn, cfg: cfg}
	results := make([]Result, len(branches))
	jobs := make(chan int)

	var wg sync.WaitGroup
	for range min(cfg.Workers, len(branches)) {
		wg.Go(func() {
			for i := range jobs {
				if ctx.Err() != nil {
					continue // stopping: skip the branches still queued
				}
				r := c.check(ctx, branches[i])
				if ctx.Err() != nil {
					continue // cut short by the cancel: not a finished branch
				}
				results[i] = r // each branch has its own element
				if tally != nil {
					tally.Add(r)
				}
			}
		})
	}

feed:
	for i := range branches {
		select {
		case jobs <- i:
		case <-ctx.Done():
			break feed
		}
	}
	close(jobs)
	wg.Wait()

	if ctx.Err() != nil {
		return nil, context.Cause(ctx)
	}
	return results, nil
}

// Report describes the results, one line per branch and a total.
func Report(results []Result) string {
	var b strings.Builder
	have, copies := 0, 0
	for _, r := range results {
		calls := plural(r.Attempts, "call", "calls")
		switch {
		case r.Err == nil && r.Copies > 0:
			have++
			copies += r.Copies
			fmt.Fprintf(&b, "%s: %s (%s)\n", r.Branch, plural(r.Copies, "copy", "copies"), calls)
		case r.Err == nil:
			fmt.Fprintf(&b, "%s: none on the shelf (%s)\n", r.Branch, calls)
		case errors.Is(r.Err, ErrNoAnswer):
			fmt.Fprintf(&b, "%s: no answer (%s)\n", r.Branch, calls)
		default:
			fmt.Fprintf(&b, "%s: failed: %v (%s)\n", r.Branch, r.Err, calls)
		}
	}
	fmt.Fprintf(&b, "%d of %d branches have it, %s in all\n", have, len(results), plural(copies, "copy", "copies"))
	return b.String()
}

// plural writes n with the singular or the plural noun.
func plural(n int, one, many string) string {
	if n == 1 {
		return "1 " + one
	}
	return fmt.Sprintf("%d %s", n, many)
}
