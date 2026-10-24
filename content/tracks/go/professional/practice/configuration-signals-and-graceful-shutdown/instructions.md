Complete the start-up and shutdown code of the rota service in `solution.go`. `ErrConfig` and
`Config` are given. In the real program, `main` calls
`loadConfig(os.Args[1:], os.LookupEnv, os.Stderr)`, gets its context from
`signal.NotifyContext(ctx, os.Interrupt, syscall.SIGTERM)` and ends with
`os.Exit(exitCode(err))`; the tests call the three functions directly.

1. **`loadConfig(args []string, lookup func(string) (string, bool), stderr io.Writer) (Config, error)`**
   - Defaults: `Addr` `127.0.0.1:8080`, `Grace` 10 s, `Workers` 4.
   - Environment, read with `lookup`: `ROTA_ADDR`, `ROTA_GRACE` (a duration such as `30s`, read
     with `time.ParseDuration`), `ROTA_WORKERS` (a whole number) and `ROTA_API_KEY`. A value that
     does not parse is an error whose message names the variable.
   - Flags, in a `flag.NewFlagSet("rota", flag.ContinueOnError)` whose output is `stderr`:
     `-addr`, `-grace` and `-workers`. There is **no** flag for the API key: secrets come from
     the environment only. Arguments that are not flags are an error.
   - Precedence: a flag beats an environment variable, which beats a default.
   - Validation: `Addr` not empty, `Grace` from 1 s to 1 min, `Workers` from 1 to 64, `APIKey` not
     empty. Report **every** problem in one error (`errors.Join`), each naming its setting
     (`addr`, `grace`, `workers`, `ROTA_API_KEY`).
   - Every error wraps `ErrConfig`, except for `-h`, which returns the `flag.ErrHelp` that
     `Parse` gives (after the FlagSet has printed its usage to `stderr`).
2. **`exitCode(err error) int`**: 0 for `nil` and for `flag.ErrHelp`, 2 for an error that wraps
   `ErrConfig`, 1 for anything else.
3. **`serve(ctx context.Context, srv *http.Server, ln net.Listener, grace time.Duration) error`**
   runs `srv.Serve(ln)` in a goroutine.
   - If `Serve` returns on its own (the listener failed), return an error at once.
   - When `ctx` is cancelled, call `srv.Shutdown` with a **new** context that times out after
     `grace`, so requests in flight can finish. Return `nil` when everything stopped in time
     (`Serve`'s `http.ErrServerClosed` is the normal case, not an error).
   - If the grace period runs out, call `srv.Close()` to cut the remaining connections and
     return an error that wraps `context.DeadlineExceeded`.

```go
env := map[string]string{"ROTA_WORKERS": "8", "ROTA_API_KEY": "k-71"}
lookup := func(k string) (string, bool) { v, ok := env[k]; return v, ok }

cfg, err := loadConfig([]string{"-workers", "2"}, lookup, io.Discard)
// cfg: {Addr:127.0.0.1:8080 Grace:10s Workers:2 APIKey:k-71}, err: nil

_, err = loadConfig([]string{"-workers", "0"}, func(string) (string, bool) { return "", false }, io.Discard)
// err wraps ErrConfig and mentions both "workers" and "ROTA_API_KEY"; exitCode(err) == 2

// serve: a request in flight when ctx is cancelled still gets its 200, new connections are
// refused, and serve returns nil.
```
