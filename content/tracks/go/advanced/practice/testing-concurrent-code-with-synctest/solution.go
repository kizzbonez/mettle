package main

import (
	"context"
	"errors"
	"fmt"
	"testing"
	"testing/synctest"
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

const limit = 10 * time.Minute

// start runs wait in its own goroutine, which reports the result on the
// returned channel. The channel has room for it, so the goroutine never
// blocks on the send and ends as soon as wait returns.
func start(ctx context.Context, wait waitFunc, arrived <-chan struct{}) <-chan error {
	result := make(chan error, 1)
	go func() {
		result <- wait(ctx, arrived, limit)
	}()
	return result
}

// peek reports whether wait has returned, and its error, without blocking.
func peek(result <-chan error) (done bool, err error) {
	select {
	case err := <-result:
		return true, err
	default:
		return false, nil
	}
}

// checkArrival returns nil if wait returns nil the moment the grown-up
// arrives, 3m30s into a 10-minute limit, and not before; otherwise an error
// that says what went wrong.
func checkArrival(t *testing.T, wait waitFunc) error {
	var problem error
	synctest.Test(t, func(t *testing.T) {
		arrived := make(chan struct{})
		result := start(t.Context(), wait, arrived)

		synctest.Sleep(3*time.Minute + 30*time.Second)
		if done, err := peek(result); done {
			problem = fmt.Errorf("wait returned %v before anyone arrived", err)
			return
		}
		close(arrived)
		synctest.Wait()
		done, err := peek(result)
		switch {
		case !done:
			problem = errors.New("wait did not return as soon as the grown-up arrived")
			<-result // let the goroutine finish before the bubble ends
		case err != nil:
			problem = fmt.Errorf("wait returned %v when the grown-up arrived, want nil", err)
		}
	})
	return problem
}

// checkLimit returns nil if, with nobody coming, wait is still waiting
// just before the 10-minute limit and has returned errLate at the limit.
func checkLimit(t *testing.T, wait waitFunc) error {
	var problem error
	synctest.Test(t, func(t *testing.T) {
		result := start(t.Context(), wait, make(chan struct{}))

		synctest.Sleep(limit - time.Nanosecond)
		if done, err := peek(result); done {
			problem = fmt.Errorf("wait returned %v before the limit", err)
			return
		}
		synctest.Sleep(time.Nanosecond)
		done, err := peek(result)
		switch {
		case !done:
			problem = errors.New("wait did not return at the limit")
			<-result
		case !errors.Is(err, errLate):
			problem = fmt.Errorf("wait returned %v at the limit, want errLate", err)
		}
	})
	return problem
}

// checkCancel returns nil if wait is still waiting when its context is
// cancelled after 4 minutes, and returns context.Canceled straight away.
func checkCancel(t *testing.T, wait waitFunc) error {
	var problem error
	synctest.Test(t, func(t *testing.T) {
		ctx, cancel := context.WithCancel(t.Context())
		defer cancel()
		result := start(ctx, wait, make(chan struct{}))

		synctest.Sleep(4 * time.Minute)
		if done, err := peek(result); done {
			problem = fmt.Errorf("wait returned %v before it was cancelled", err)
			return
		}
		cancel()
		synctest.Wait()
		done, err := peek(result)
		switch {
		case !done:
			problem = errors.New("wait did not return when its context was cancelled")
			<-result
		case !errors.Is(err, context.Canceled):
			problem = fmt.Errorf("wait returned %v when cancelled, want context.Canceled", err)
		}
	})
	return problem
}
