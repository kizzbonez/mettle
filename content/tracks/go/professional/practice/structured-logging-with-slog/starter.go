package main

import (
	"context"
	"io"
	"log/slog"
)

// Guest is a sauna guest. Phone is personal data and is never logged in full.
type Guest struct {
	Name   string
	Phone  string
	Visits int
}

// kioskKey is the context key under which withKiosk stores the kiosk's ID.
type kioskKey struct{}

// withKiosk returns a context that carries the ID of the kiosk serving the request.
func withKiosk(ctx context.Context, id string) context.Context {
	return context.WithValue(ctx, kioskKey{}, id)
}

// LogValue logs a guest as a group with a masked phone number.
func (g Guest) LogValue() slog.Value {
	panic("not implemented")
}

// kioskHandler adds a "kiosk" attribute from the context to every record.
type kioskHandler struct {
	slog.Handler
}

// Handle adds the kiosk ID, when the context has one, and passes the record on.
func (h kioskHandler) Handle(ctx context.Context, r slog.Record) error {
	panic("not implemented")
}

// newLogger returns a JSON logger writing to w at the level held by level.
func newLogger(w io.Writer, level *slog.LevelVar) *slog.Logger {
	panic("not implemented")
}

// logCheckIn records a guest checking in at the kiosk in ctx.
func logCheckIn(ctx context.Context, logger *slog.Logger, g Guest, pin string) {
	panic("not implemented")
}
