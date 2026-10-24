package main

import (
	"context"
	"io"
	"log/slog"
	"strings"
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

// maskPhone keeps the last three characters of a phone number and hides the rest.
func maskPhone(phone string) string {
	if len(phone) <= 3 {
		return strings.Repeat("*", len(phone))
	}
	return strings.Repeat("*", len(phone)-3) + phone[len(phone)-3:]
}

// LogValue logs a guest as a group with a masked phone number.
func (g Guest) LogValue() slog.Value {
	return slog.GroupValue(
		slog.String("name", g.Name),
		slog.String("phone", maskPhone(g.Phone)),
		slog.Int("visits", g.Visits),
	)
}

// kioskHandler adds a "kiosk" attribute from the context to every record.
type kioskHandler struct {
	slog.Handler
}

// Handle adds the kiosk ID, when the context has one, and passes the record on.
func (h kioskHandler) Handle(ctx context.Context, r slog.Record) error {
	if id, ok := ctx.Value(kioskKey{}).(string); ok {
		r.AddAttrs(slog.String("kiosk", id))
	}
	return h.Handler.Handle(ctx, r)
}

// WithAttrs keeps the wrapper around the handler that logger.With returns.
func (h kioskHandler) WithAttrs(attrs []slog.Attr) slog.Handler {
	return kioskHandler{h.Handler.WithAttrs(attrs)}
}

// WithGroup keeps the wrapper around the handler that logger.WithGroup returns.
func (h kioskHandler) WithGroup(name string) slog.Handler {
	return kioskHandler{h.Handler.WithGroup(name)}
}

// cleanAttr drops the top-level time and redacts secrets at any depth.
func cleanAttr(groups []string, a slog.Attr) slog.Attr {
	if a.Key == slog.TimeKey && len(groups) == 0 {
		return slog.Attr{}
	}
	if a.Key == "pin" || a.Key == "card" {
		return slog.String(a.Key, "[redacted]")
	}
	return a
}

// newLogger returns a JSON logger writing to w at the level held by level.
func newLogger(w io.Writer, level *slog.LevelVar) *slog.Logger {
	h := slog.NewJSONHandler(w, &slog.HandlerOptions{
		Level:       level,
		ReplaceAttr: cleanAttr,
	})
	return slog.New(kioskHandler{h})
}

// logCheckIn records a guest checking in at the kiosk in ctx.
func logCheckIn(ctx context.Context, logger *slog.Logger, g Guest, pin string) {
	if g.Visits == 0 {
		logger.DebugContext(ctx, "new guest", "name", g.Name)
	}
	logger.InfoContext(ctx, "guest checked in", "guest", g, "pin", pin)
}
