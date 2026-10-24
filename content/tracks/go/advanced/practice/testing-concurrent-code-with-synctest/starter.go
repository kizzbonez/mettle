package main

import (
	"context"
	"errors"
	"testing"
	"time"
)

// errLate is what a wait returns when nobody came before the limit.
var errLate = errors.New("nobody came before the limit")

// A waitFunc keeps a child at the school gate until a grown-up arrives. It
// returns nil as soon as arrived is closed, an error that is errLate once
// limit has passed, or an error that is ctx's error if ctx is done first.
type waitFunc func(ctx context.Context, arrived <-chan struct{}, limit time.Duration) error

// gateWait is the wait the school uses. Your checks must accept it.
func gateWait(ctx context.Context, arrived <-chan struct{}, limit time.Duration) error {
	timer := time.NewTimer(limit)
	defer timer.Stop()
	select {
	case <-arrived:
		return nil
	case <-timer.C:
		return errLate
	case <-ctx.Done():
		return ctx.Err()
	}
}

// checkArrival returns nil if wait returns nil the moment the grown-up
// arrives, 3m30s into a 10-minute limit, and not before; otherwise an error
// that says what went wrong.
func checkArrival(t *testing.T, wait waitFunc) error {
	panic("not implemented")
}

// checkLimit returns nil if, with nobody coming, wait is still waiting
// just before the 10-minute limit and has returned errLate at the limit.
func checkLimit(t *testing.T, wait waitFunc) error {
	panic("not implemented")
}

// checkCancel returns nil if wait is still waiting when its context is
// cancelled after 4 minutes, and returns context.Canceled straight away.
func checkCancel(t *testing.T, wait waitFunc) error {
	panic("not implemented")
}
