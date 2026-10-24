package main

import (
	"context"
	"errors"
	"time"
)

// ErrTooSlow is the cause given to a bake's context when its time limit runs out.
var ErrTooSlow = errors.New("the pizza took too long")

// waitForPizza returns the next pizza from the oven, or ctx.Err() as soon as ctx ends.
func waitForPizza(ctx context.Context, oven <-chan string) (string, error) {
	select {
	case pizza := <-oven:
		return pizza, nil
	case <-ctx.Done():
		return "", ctx.Err()
	}
}

// bakeWithin calls bake with a context that ends after limit, with ErrTooSlow as its cause,
// and reports the cause when the bake fails because that context ended.
func bakeWithin(ctx context.Context, limit time.Duration, bake func(ctx context.Context) (string, error)) (string, error) {
	ctx, cancel := context.WithTimeoutCause(ctx, limit, ErrTooSlow)
	// Cancelling releases the timer at once, even when the bake finishes early.
	defer cancel()
	pizza, err := bake(ctx)
	if err != nil && ctx.Err() != nil {
		// The bake failed because its context ended: say why it ended.
		return "", context.Cause(ctx)
	}
	return pizza, err
}

// ticketKey is the context key for the ticket number. Its type is unexported, so no other
// package can make a key equal to it.
type ticketKey struct{}

// withTicket returns a context that carries the order's ticket number.
func withTicket(ctx context.Context, ticket int) context.Context {
	return context.WithValue(ctx, ticketKey{}, ticket)
}

// ticketFrom returns the ticket number ctx carries, if any.
func ticketFrom(ctx context.Context) (int, bool) {
	ticket, ok := ctx.Value(ticketKey{}).(int)
	return ticket, ok
}
