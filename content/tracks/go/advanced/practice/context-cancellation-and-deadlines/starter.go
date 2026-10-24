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
	panic("not implemented")
}

// bakeWithin calls bake with a context that ends after limit, with ErrTooSlow as its cause,
// and reports the cause when the bake fails because that context ended.
func bakeWithin(ctx context.Context, limit time.Duration, bake func(ctx context.Context) (string, error)) (string, error) {
	panic("not implemented")
}

// withTicket returns a context that carries the order's ticket number.
func withTicket(ctx context.Context, ticket int) context.Context {
	panic("not implemented")
}

// ticketFrom returns the ticket number ctx carries, if any.
func ticketFrom(ctx context.Context) (int, bool) {
	panic("not implemented")
}
