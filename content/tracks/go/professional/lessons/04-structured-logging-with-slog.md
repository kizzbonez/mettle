---
title: Structured Logging with slog
summary: Replace printf-style logs with log/slog, writing key-value records through text or JSON handlers, with levels you can change at run time, redaction, groups, context values, LogValuer types and several destinations at once.
minutes: 35
objectives:
  - Log with slog using key-value pairs and typed attributes, and explain why structured logs beat printf logs
  - Configure TextHandler and JSONHandler with a LevelVar and a ReplaceAttr that redacts secrets and drops the time
  - Add context with With, groups, InfoContext, a LogValuer type and a handler that wraps another
  - Fan out to several handlers with slog.NewMultiHandler and test log output through a bytes.Buffer
---

## Outline

1. From log.Printf to slog
2. Handlers and levels
3. Options: redaction, stable output, source lines
4. With and groups
5. Types that log themselves
6. Context and wrapping handlers
7. Several destinations and testing logs
8. What to log and what never to log

## From log.Printf to slog

The `log` package writes one line of text per call. That is fine for a person reading a
terminal, but a service in production sends millions of lines to a log system, where someone
asks "every failure for kiln K2 last night". With `log.Printf("kiln %s fired to %d C", ...)` the
kiln is buried in a sentence and only a fragile regular expression can find it. A **structured
log** record has a fixed message plus named **attributes**, so the log system can filter on
`kiln=K2` exactly. Go's standard package for that is `log/slog`:

```go
package main

import (
	"log"
	"log/slog"
	"os"
)

func main() {
	log.Printf("kiln %s fired to %d C", "K2", 1260)
	slog.Info("kiln fired", "kiln", "K2", "temp_c", 1260)

	text := slog.New(slog.NewTextHandler(os.Stdout, nil))
	text.Info("kiln fired", "kiln", "K2", "temp_c", 1260)
	text.Debug("door sensor read", "open", false)

	js := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	js.Warn("kiln slow to cool", slog.String("kiln", "K2"), slog.Int("minutes", 95))
}
```

```text
2026/10/24 16:38:42 kiln K2 fired to 1260 C
2026/10/24 16:38:42 INFO kiln fired kiln=K2 temp_c=1260
time=2026-10-24T16:38:42.995Z level=INFO msg="kiln fired" kiln=K2 temp_c=1260
{"time":"2026-10-24T16:38:42.995955404Z","level":"WARN","msg":"kiln slow to cool","kiln":"K2","minutes":95}
```

After the message come alternating keys and values, or typed **attributes** made with
`slog.String`, `slog.Int`, `slog.Bool`, `slog.Duration`, `slog.Any`. The typed form cannot pair
a key with the wrong value, and `logger.LogAttrs(ctx, level, msg, attrs...)` takes only typed
attributes, which allocates least on hot paths. The top-level `slog.Info` uses a default logger
that writes through the `log` package, to standard error. The `Debug` line is missing: that
is the level at work.

## Handlers and levels

A `*slog.Logger` is the front end you call; a **handler** decides the format and the
destination. `TextHandler` writes `key=value` pairs that people can read; `JSONHandler` writes
one JSON object per line, which log systems ingest without parsing rules. Production services
usually log JSON.

Levels are numbers: `LevelDebug` (-4), `LevelInfo` (0), `LevelWarn` (4), `LevelError` (8). A
handler drops records below its minimum, which defaults to Info. Put the minimum in a
`slog.LevelVar` and you can change it while the program runs, for example from an admin
endpoint during an incident, without a restart. A `LevelVar` is safe to set from any goroutine.

## Options: redaction, stable output, source lines

`slog.HandlerOptions` has three fields. `Level` takes the minimum (a level or a `LevelVar`).
`AddSource: true` adds the file and line of each call. `ReplaceAttr` is called for every
attribute, built-in ones included (`time`, `level`, `msg`, `source`), with the names of the
groups it is in; whatever it returns is logged, and an empty `slog.Attr{}` removes it. Use it
to redact secrets and, in tests, to drop the time so output is the same on every run:

```go
// cleanAttrs drops the time (so output is stable) and hides secrets.
func cleanAttrs(groups []string, a slog.Attr) slog.Attr {
	if a.Key == slog.TimeKey && len(groups) == 0 {
		return slog.Attr{}
	}
	if a.Key == "password" || a.Key == "token" {
		return slog.String(a.Key, "[redacted]")
	}
	return a
}

func main() {
	level := new(slog.LevelVar) // starts at Info
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level:       level,
		ReplaceAttr: cleanAttrs,
	}))

	logger.Debug("checking thermocouple", "kiln", "K2")
	logger.Info("member signed in", "member", "ines", "token", "tk_live_8f2a")
	level.Set(slog.LevelDebug)
	logger.Debug("checking thermocouple", "kiln", "K2")

	firing := logger.With("kiln", "K2", "firing", 118)
	firing.Info("ramp started", slog.Group("target", "temp_c", 1260, "hours", 9))
	firing.Error("element failed", slog.GroupAttrs("element", slog.Int("zone", 3), slog.Float64("ohms", 0.4)))
}
```

```text
{"level":"INFO","msg":"member signed in","member":"ines","token":"[redacted]"}
{"level":"DEBUG","msg":"checking thermocouple","kiln":"K2"}
{"level":"INFO","msg":"ramp started","kiln":"K2","firing":118,"target":{"temp_c":1260,"hours":9}}
{"level":"ERROR","msg":"element failed","kiln":"K2","firing":118,"element":{"zone":3,"ohms":0.4}}
```

The first `Debug` was dropped; after `level.Set` the second one appears.

## With and groups

`logger.With(...)` returns a logger that adds the same attributes to every record, so a
handler for one firing does not repeat `kiln` and `firing` in each call (and the handler formats
them once). A **group** nests attributes under one key: `target.temp_c` in text, a nested object
in JSON. `slog.Group` takes keys and values or attributes; Go 1.25's `slog.GroupAttrs` takes only
`slog.Attr` values and is cheaper. `logger.WithGroup("kiln")` puts everything logged later inside
a group.

## Types that log themselves

A type with a `LogValue() slog.Value` method is a **LogValuer**: slog calls it when the value is
logged. Use it to log a struct as a group and to leave personal data out in one place, rather
than trusting every call site to remember.

## Context and wrapping handlers

`logger.InfoContext(ctx, ...)` passes a context to the handler. The built-in handlers ignore
it, but a handler that wraps another can read request-scoped values, such as a request ID that
middleware stored with `context.WithValue` (Advanced lesson 05). A wrapper must also override
`WithAttrs` and `WithGroup`, or `logger.With` returns the inner handler and the wrapper is lost.

## Several destinations and testing logs

Go 1.26's `slog.NewMultiHandler(h1, h2, ...)` sends each record to every handler that is
enabled for its level: text to the terminal, JSON to a file. A `bytes.Buffer` is an `io.Writer`,
so a test can log into one and decode what was written:

```go
type Member struct {
	ID    int
	Name  string
	Email string
}

func (m Member) LogValue() slog.Value {
	return slog.GroupValue(slog.Int("id", m.ID), slog.String("name", m.Name))
}

type requestIDKey struct{}

type requestIDHandler struct{ slog.Handler }

func (h requestIDHandler) Handle(ctx context.Context, r slog.Record) error {
	if id, ok := ctx.Value(requestIDKey{}).(string); ok {
		r.AddAttrs(slog.String("request_id", id))
	}
	return h.Handler.Handle(ctx, r)
}

func (h requestIDHandler) WithAttrs(attrs []slog.Attr) slog.Handler {
	return requestIDHandler{h.Handler.WithAttrs(attrs)}
}

func (h requestIDHandler) WithGroup(name string) slog.Handler {
	return requestIDHandler{h.Handler.WithGroup(name)}
}

func main() {
	var buf bytes.Buffer
	noTime := &slog.HandlerOptions{ReplaceAttr: func(groups []string, a slog.Attr) slog.Attr {
		if a.Key == slog.TimeKey && len(groups) == 0 {
			return slog.Attr{}
		}
		return a
	}}
	logger := slog.New(requestIDHandler{slog.NewMultiHandler(
		slog.NewTextHandler(os.Stdout, noTime),
		slog.NewJSONHandler(&buf, noTime),
	)})

	ctx := context.WithValue(context.Background(), requestIDKey{}, "req-7f3")
	ines := Member{ID: 41, Name: "Ines", Email: "ines@example.com"}
	logger.InfoContext(ctx, "kiln booked", "member", ines, "kiln", "K2")

	var entry map[string]any
	if err := json.Unmarshal(buf.Bytes(), &entry); err != nil {
		fmt.Println("bad JSON:", err)
		return
	}
	fmt.Println("JSON copy:", entry["msg"], entry["member"], entry["request_id"])
}
```

```text
level=INFO msg="kiln booked" member.id=41 member.name=Ines kiln=K2 request_id=req-7f3
JSON copy: kiln booked map[id:41 name:Ines] req-7f3
```

The email address never reaches either destination.

## What to log and what never to log

Log events someone will act on or search for: requests with their status and duration,
retries, failures with their error, start-up configuration (minus secrets). Use Debug for
detail you switch on during an investigation. Never log passwords, tokens, API keys, session
cookies, full card numbers or whole request bodies: logs are copied to many systems and kept
for a long time. Redact at the source with `LogValue`, and keep `ReplaceAttr` as a safety net.

## Common mistakes

- **A missing key or value.** `slog.Info("kiln fired", "kiln", "K2", 1260)` logs
  `!BADKEY=1260`. `go vet` catches it: `slog.Info arg "1260" should be a string or a slog.Attr
  (possible missing key or value)`.
- **Building the message with `fmt.Sprintf`.** `slog.Info(fmt.Sprintf("kiln %s fired", k))`
  throws the structure away. Keep the message fixed and put values in attributes.
- **A wrapping handler without `WithAttrs`.** After `logger.With("kiln", "K2")` the
  `request_id` silently disappears from the output.
- **Comparing log lines that contain the time** in tests. Drop `time` with `ReplaceAttr`.

## Practice

1. Write a `ReplaceAttr` that drops the time and renames `msg` to `message`.
2. What does `logger.Info("saved", "count")` print with a JSON handler?
3. How do you turn on Debug output in a running service?

### Answers

```go
logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
	ReplaceAttr: func(groups []string, a slog.Attr) slog.Attr {
		switch {
		case len(groups) > 0:
			return a
		case a.Key == slog.TimeKey:
			return slog.Attr{}
		case a.Key == slog.MessageKey:
			a.Key = "message"
		}
		return a
	},
}))
logger.Info("glaze mixed", "batch", 12)
logger.Info("saved", "count")
```

```text
{"level":"INFO","message":"glaze mixed","batch":12}
{"level":"INFO","message":"saved","!BADKEY":"count"}
```

For 2, vet also reports `call to slog.Logger.Info missing a final value`. For 3, build the
handler with `Level: levelVar` and call `levelVar.Set(slog.LevelDebug)`, for example from an
admin endpoint.

## Key takeaways

- A fixed message plus attributes; prefer typed attributes and `LogAttrs` on hot paths.
- JSON in production, text for people; `LevelVar` changes the level at run time.
- `ReplaceAttr` redacts and stabilizes output; `LogValue` keeps personal data out at the source.
- `With`, groups and `InfoContext` add context; wrapping handlers must override `WithAttrs` and
  `WithGroup`.
- `NewMultiHandler` fans out; a `bytes.Buffer` makes logs testable.

## Further reading

- [log/slog package](https://pkg.go.dev/log/slog)
- [Structured Logging with slog](https://go.dev/blog/slog)
- [Go by Example: Logging](https://gobyexample.com/logging)
