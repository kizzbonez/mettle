package main

import (
	"context"
	"sync"
)

// crates sends the weight of every crate that is not empty, in delivery
// order, and closes the channel when it is done or when ctx is done.
func crates(ctx context.Context, weights []int) <-chan int {
	out := make(chan int)
	go func() {
		defer close(out)
		for _, kg := range weights {
			if kg <= 0 {
				continue // an empty crate
			}
			select {
			case out <- kg:
			case <-ctx.Done():
				return
			}
		}
	}()
	return out
}

// merge copies every belt onto one channel, which it closes once every
// copier has finished.
func merge(ctx context.Context, belts ...<-chan int) <-chan int {
	out := make(chan int)
	var wg sync.WaitGroup
	for _, belt := range belts {
		wg.Go(func() {
			for kg := range belt {
				select {
				case out <- kg:
				case <-ctx.Done():
					return
				}
			}
		})
	}
	go func() {
		wg.Wait() // no copier will send again
		close(out)
	}()
	return out
}

// pressAll presses every weight with at most presses presses at once and
// returns the litres in the order of weights, or the first error.
func pressAll(ctx context.Context, weights []int, presses int, press func(ctx context.Context, kg int) (int, error)) ([]int, error) {
	litres := make([]int, len(weights))
	if len(weights) == 0 {
		return litres, nil
	}

	ctx, cancel := context.WithCancelCause(ctx)
	defer cancel(nil)

	var (
		wg       sync.WaitGroup
		once     sync.Once
		firstErr error
	)
	jobs := make(chan int)
	for range max(1, min(presses, len(weights))) {
		wg.Go(func() {
			for i := range jobs {
				if ctx.Err() != nil {
					continue // stopping: skip the crates still queued
				}
				l, err := press(ctx, weights[i])
				if err != nil {
					once.Do(func() {
						firstErr = err
						cancel(err) // stop the presses that are still running
					})
					continue
				}
				litres[i] = l // each worker writes only its own crate's element
			}
		})
	}

feed:
	for i := range weights {
		select {
		case jobs <- i:
		case <-ctx.Done():
			break feed
		}
	}
	close(jobs)
	wg.Wait()

	if firstErr != nil {
		return nil, firstErr
	}
	if ctx.Err() != nil {
		return nil, context.Cause(ctx) // the caller cancelled before every crate was pressed
	}
	return litres, nil
}
