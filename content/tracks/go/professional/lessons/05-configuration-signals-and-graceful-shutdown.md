---
title: Configuration, Signals and Graceful Shutdown
summary: Load a validated Config from defaults, environment variables and a testable FlagSet, keep secrets out of flags, stop on SIGINT or SIGTERM with signal.NotifyContext, and shut an HTTP server down without dropping requests.
minutes: 35
objectives:
  - Build a Config from defaults, environment variables and flags with the precedence flag > env > default, and test it without touching the real process
  - Validate configuration at start-up and exit with a clear message and the right exit code
  - Turn SIGINT and SIGTERM into context cancellation with signal.NotifyContext and read the signal from context.Cause
  - Shut down an http.Server gracefully with Shutdown and a deadline, and drain background workers
---

## Outline

1. One Config, three sources
2. A FlagSet you can test
3. Environment variables and secrets
4. Fail fast, with the right exit code
5. Signals become a cancelled context
6. Graceful shutdown

## One Config, three sources

A service needs settings that change between deployments: the address to listen on, timeouts,
the database URL, API keys. The **twelve-factor** guideline is to keep such configuration out
of the code, in the environment, so the same binary runs in test and in production. Collect
every setting into one `Config` struct, filled once at start-up and passed to the code that
needs it: nothing deeper in the program reads flags or `os.Getenv` itself.

Values come from three places, and the most specific wins: a **flag** typed for this run beats
an **environment variable** set for this deployment, which beats the **default** in the code.

## A FlagSet you can test

Basic lesson 15 used the global `flag.Int` and `flag.Parse`, which read `os.Args` and exit the
program on a bad flag. Neither is testable. `flag.NewFlagSet(name, flag.ContinueOnError)`
creates a separate set that parses any slice you pass and returns errors instead of exiting.
Pass the environment in as a function too: production passes `os.LookupEnv`, a test passes a
map lookup.

```go
type Config struct {
	Addr    string
	Timeout time.Duration
	Token   string // secret: from the environment only
}

// loadConfig reads defaults, then the environment, then flags: later sources win.
func loadConfig(args []string, getenv func(string) (string, bool), stderr io.Writer) (Config, error) {
	cfg := Config{Addr: "127.0.0.1:8080", Timeout: 5 * time.Second}
	if v, ok := getenv("TIDES_ADDR"); ok {
		cfg.Addr = v
	}
	if v, ok := getenv("TIDES_TIMEOUT"); ok {
		d, err := time.ParseDuration(v)
		if err != nil {
			return Config{}, fmt.Errorf("TIDES_TIMEOUT: %w", err)
		}
		cfg.Timeout = d
	}
	cfg.Token, _ = getenv("TIDES_TOKEN")

	fs := flag.NewFlagSet("tides", flag.ContinueOnError)
	fs.SetOutput(stderr)
	fs.StringVar(&cfg.Addr, "addr", cfg.Addr, "listen address")
	fs.DurationVar(&cfg.Timeout, "timeout", cfg.Timeout, "upstream timeout")
	if err := fs.Parse(args); err != nil {
		return Config{}, err
	}

	var problems []error
	if cfg.Timeout <= 0 || cfg.Timeout > time.Minute {
		problems = append(problems, fmt.Errorf("timeout %v: want more than 0 and at most 1m", cfg.Timeout))
	}
	if cfg.Token == "" {
		problems = append(problems, errors.New("TIDES_TOKEN is not set"))
	}
	if err := errors.Join(problems...); err != nil {
		return Config{}, err
	}
	return cfg, nil
}
```

The trick for precedence is the order: the environment overwrites the defaults, and those
values become the flags' defaults, so a flag overwrites them only when it is given. With
`TIDES_ADDR=:9000` and a token in a fake environment, four argument lists, then no token and a
two-hour timeout:

```text
[] -> addr=:9000 timeout=5s err=<nil>
["-addr" ":7000" "-timeout" "2s"] -> addr=:7000 timeout=2s err=<nil>
["-timeout" "0s"] -> addr= timeout=0s err=timeout 0s: want more than 0 and at most 1m
["-port" "80"] -> addr= timeout=0s err=flag provided but not defined: -port
no token:
timeout 2h0m0s: want more than 0 and at most 1m
TIDES_TOKEN is not set
```

`errors.Join` (Medium lesson 05) reports every problem at once, so an operator fixes them in
one go instead of one restart at a time.

## Environment variables and secrets

`os.Getenv` returns `""` both for a variable that is unset and for one set to the empty string.
`os.LookupEnv` returns a second result, `ok`, that tells them apart, which matters when an empty
value means something. Parse and check every value from the environment as carefully as user
input, and name the variable in the error.

Secrets such as tokens and passwords never go in flags: every user on the machine can see a
process's arguments (`ps`), and they land in shell history and in the logs of the tools that
start the service. Read them from the environment or from a file the platform mounts, and never
log them (lesson 04).

## Fail fast, with the right exit code

Check the whole configuration before the service opens a port or a database. A wrong value
found at start-up stops a deployment at once; the same mistake found at 3 a.m. in the middle of
a request is an outage. By convention a program exits with 0 on success, 1 on a failure while
running and 2 for bad usage or configuration. With `ContinueOnError`, `-h` returns
`flag.ErrHelp` after printing the usage, which is a successful exit. `main` turns errors into
exit codes; the built binary run as `./tides -port 80; echo "exit=$?"` shows the FlagSet's
message and usage on standard error, then `main`'s own line:

```text
flag provided but not defined: -port
Usage of tides:
  -addr string
    	listen address (default "127.0.0.1:8080")
  -timeout duration
    	upstream timeout (default 5s)
tides: flag provided but not defined: -port
exit=2
```

Remember from Medium lesson 06 that `os.Exit` skips deferred calls, so call it only in `main`,
after everything that needs cleaning up has returned.

## Signals become a cancelled context

When a platform stops a service (Docker, Kubernetes, systemd), it sends **SIGTERM**, waits a
grace period (10 s for `docker stop`, 30 s by default in Kubernetes), then kills the process
with SIGKILL. Ctrl+C in a terminal sends **SIGINT** (`os.Interrupt`). By default either one ends
a Go program at once, in the middle of whatever it was doing.

`signal.NotifyContext(parent, os.Interrupt, syscall.SIGTERM)` returns a context that is
cancelled when one of those signals arrives, plus a `stop` function to call with `defer`. Since
Go 1.26, `context.Cause(ctx)` says which signal it was, such as `interrupt signal received`. The
rest of the program already knows how to stop when a context ends (Advanced lesson 05), so a
signal needs no special code anywhere else.

## Graceful shutdown

`srv.Shutdown(ctx)` closes the listeners so no new connections arrive, closes idle connections,
and waits for requests in flight to finish. Give it a deadline shorter than the platform's grace
period; if the deadline passes, `Shutdown` returns the context's error and you can fall back to
`srv.Close()`. When `Shutdown` starts, `Serve` returns `http.ErrServerClosed`, which is the
normal case and not a failure:

```go
// serve runs srv on ln until ctx is cancelled, then shuts it down gracefully,
// giving requests in flight up to grace to finish.
func serve(ctx context.Context, srv *http.Server, ln net.Listener, grace time.Duration) error {
	errc := make(chan error, 1)
	go func() { errc <- srv.Serve(ln) }()

	select {
	case err := <-errc:
		return err // the server failed on its own
	case <-ctx.Done():
	}
	fmt.Println("stopping:", context.Cause(ctx))

	shutdownCtx, cancel := context.WithTimeout(context.Background(), grace)
	defer cancel()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		return fmt.Errorf("shutdown: %w", err)
	}
	if err := <-errc; !errors.Is(err, http.ErrServerClosed) {
		return err
	}
	return nil
}
```

The shutdown context is new, from `context.Background()`: the signal context is already
cancelled, and passing it would give `Shutdown` no time at all. In a test program, `main` gets
its `ctx` from `signal.NotifyContext`, starts a request to a handler that takes 300 ms, and sends
itself SIGTERM with `syscall.Kill` as soon as the handler starts:

```text
stopping: terminated signal received
client: 200 OK "report ready"
after shutdown: true
clean exit
```

The request in flight finished; a new request after shutdown failed. Background workers drain
the same way: stop accepting work (`close(jobs)`), then wait for the workers with their
`WaitGroup` before `main` returns.

## Common mistakes

- **Passing the cancelled signal context to `Shutdown`.** It returns `context canceled` at once
  and drops every request in flight.
- **Treating `http.ErrServerClosed` as a failure.** Logging it as an error, or exiting with 1,
  after every clean deploy.
- **Exiting `main` while `Shutdown` is still waiting.** `main` must wait for `serve` to return.
- **Using the global `flag` functions in testable code.** `flag.Parse` exits the test binary on a
  bad flag; use a `FlagSet` with `ContinueOnError`.
- **A secret as a flag.** `-token=...` is visible in `ps` and shell history.

## Practice

1. `TIDES_ADDR` is set to the empty string. What do `os.Getenv` and `os.LookupEnv` return?
2. After Ctrl+C, what do `ctx.Err()` and `context.Cause(ctx)` print?
3. Kubernetes gives a pod 30 s after SIGTERM. Is a grace of 30 s for `Shutdown` right?

### Answers

```go
os.Setenv("TIDES_ADDR", "")
v, ok := os.LookupEnv("TIDES_ADDR")
fmt.Printf("Getenv=%q LookupEnv=%q,%t\n", os.Getenv("TIDES_ADDR"), v, ok)
// ... NotifyContext(ctx, os.Interrupt), then SIGINT sent to the process
fmt.Println(ctx.Err(), "/", context.Cause(ctx))
```

```text
Getenv="" LookupEnv="",true
context canceled / interrupt signal received
```

For 3, no: leave time for the rest of the shutdown (workers, logs, database) before SIGKILL
arrives, for example 20 to 25 s.

## Key takeaways

- One `Config`, filled once: defaults, then environment, then flags; validate all of it at
  start-up and report every problem.
- `flag.NewFlagSet` with `ContinueOnError` and an injected lookup function make configuration
  testable.
- Secrets come from the environment or files, never flags or logs.
- `signal.NotifyContext` turns SIGINT and SIGTERM into cancellation; `context.Cause` names the
  signal.
- `Shutdown` with a fresh deadline context; `ErrServerClosed` means success.

## Further reading

- [os/signal: NotifyContext](https://pkg.go.dev/os/signal#NotifyContext)
- [net/http: Server.Shutdown](https://pkg.go.dev/net/http#Server.Shutdown)
- [The Twelve-Factor App: Config](https://12factor.net/config)
- [Go by Example: Signals](https://gobyexample.com/signals)
