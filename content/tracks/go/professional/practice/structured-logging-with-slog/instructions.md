Complete the logging for the sauna's check-in kiosk in `solution.go`. `Guest`, `kioskKey` and
`withKiosk` are written for you.

1. **`(g Guest) LogValue() slog.Value`** makes `Guest` a `slog.LogValuer`. Return a group value
   with three attributes, in this order: `name` (string), `phone` (string) and `visits` (int).
   The phone is **masked**: keep its last three characters and replace every earlier one with
   `*`, so `07700900123` becomes `********123`. A phone of three characters or fewer is all
   stars (`"12"` becomes `"**"`, and `""` stays `""`).
2. **`kioskHandler`** wraps another handler. Write its **`Handle(ctx, r)`**: if `ctx` holds a
   kiosk ID (a string under `kioskKey{}`), add the attribute `kiosk` with that ID to the record,
   then pass the record to the wrapped handler. Also give `kioskHandler` its own **`WithAttrs`**
   and **`WithGroup`** methods that return a `kioskHandler` around the wrapped handler's result,
   so that the kiosk ID is still added after `logger.With(...)` or `logger.WithGroup(...)`.
3. **`newLogger(w io.Writer, level *slog.LevelVar) *slog.Logger`** returns a logger that writes
   JSON lines to `w` through a `kioskHandler`, with `slog.HandlerOptions` that
   - use `level` as the minimum level, so changing it later changes what is logged;
   - drop the built-in `time` attribute (only the top-level one: an attribute called `time`
     inside a group stays);
   - replace the value of any attribute whose key is `pin` or `card`, **at any depth**, with
     the string `[redacted]`.
4. **`logCheckIn(ctx context.Context, logger *slog.Logger, g Guest, pin string)`** logs at Info,
   with the context, the message `guest checked in` and two attributes: `guest` (the guest
   itself, so `LogValue` runs) and `pin`. For a guest with 0 visits, first log at Debug, with
   the context, the message `new guest` and the attribute `name`.

```go
var buf bytes.Buffer
level := new(slog.LevelVar) // Info
logger := newLogger(&buf, level)
ctx := withKiosk(context.Background(), "north-door")
logCheckIn(ctx, logger, Guest{Name: "Aino", Phone: "07700900123", Visits: 4}, "4821")
```

```text
{"level":"INFO","msg":"guest checked in","guest":{"name":"Aino","phone":"********123","visits":4},"pin":"[redacted]","kiosk":"north-door"}
```
