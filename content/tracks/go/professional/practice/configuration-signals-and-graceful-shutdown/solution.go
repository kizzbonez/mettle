package main

import (
	"context"
	"errors"
	"flag"
	"fmt"
	"io"
	"net"
	"net/http"
	"strconv"
	"time"
)

// ErrConfig marks a configuration problem; main exits with code 2 for it.
var ErrConfig = errors.New("invalid configuration")

// Config holds every setting of the rota service.
type Config struct {
	Addr    string
	Grace   time.Duration
	Workers int
	APIKey  string // secret: read from the environment only
}

// loadConfig builds the Config from defaults, then the environment, then flags,
// so a flag beats an environment variable, which beats a default.
func loadConfig(args []string, lookup func(string) (string, bool), stderr io.Writer) (Config, error) {
	cfg := Config{Addr: "127.0.0.1:8080", Grace: 10 * time.Second, Workers: 4}

	if v, ok := lookup("ROTA_ADDR"); ok {
		cfg.Addr = v
	}
	if v, ok := lookup("ROTA_GRACE"); ok {
		d, err := time.ParseDuration(v)
		if err != nil {
			return Config{}, fmt.Errorf("%w: ROTA_GRACE: %w", ErrConfig, err)
		}
		cfg.Grace = d
	}
	if v, ok := lookup("ROTA_WORKERS"); ok {
		n, err := strconv.Atoi(v)
		if err != nil {
			return Config{}, fmt.Errorf("%w: ROTA_WORKERS: %w", ErrConfig, err)
		}
		cfg.Workers = n
	}
	cfg.APIKey, _ = lookup("ROTA_API_KEY")

	// The environment's values become the flags' defaults, so a flag wins only when given.
	fs := flag.NewFlagSet("rota", flag.ContinueOnError)
	fs.SetOutput(stderr)
	fs.StringVar(&cfg.Addr, "addr", cfg.Addr, "listen address")
	fs.DurationVar(&cfg.Grace, "grace", cfg.Grace, "time allowed for requests in flight at shutdown")
	fs.IntVar(&cfg.Workers, "workers", cfg.Workers, "number of reminder workers")
	if err := fs.Parse(args); err != nil {
		if errors.Is(err, flag.ErrHelp) {
			return Config{}, err
		}
		return Config{}, fmt.Errorf("%w: %w", ErrConfig, err)
	}
	if fs.NArg() > 0 {
		return Config{}, fmt.Errorf("%w: unexpected arguments %q", ErrConfig, fs.Args())
	}

	// Report every problem at once, so they can all be fixed before the next start.
	var problems []error
	if cfg.Addr == "" {
		problems = append(problems, errors.New("addr must not be empty"))
	}
	if cfg.Grace < time.Second || cfg.Grace > time.Minute {
		problems = append(problems, fmt.Errorf("grace %v must be between 1s and 1m", cfg.Grace))
	}
	if cfg.Workers < 1 || cfg.Workers > 64 {
		problems = append(problems, fmt.Errorf("workers %d must be between 1 and 64", cfg.Workers))
	}
	if cfg.APIKey == "" {
		problems = append(problems, errors.New("ROTA_API_KEY is not set"))
	}
	if err := errors.Join(problems...); err != nil {
		return Config{}, fmt.Errorf("%w: %w", ErrConfig, err)
	}
	return cfg, nil
}

// exitCode maps the error that ended the program to its exit status.
func exitCode(err error) int {
	switch {
	case err == nil, errors.Is(err, flag.ErrHelp):
		return 0
	case errors.Is(err, ErrConfig):
		return 2
	default:
		return 1
	}
}

// serve runs srv on ln until ctx is cancelled, then shuts it down gracefully,
// giving requests in flight up to grace to finish.
func serve(ctx context.Context, srv *http.Server, ln net.Listener, grace time.Duration) error {
	errc := make(chan error, 1)
	go func() { errc <- srv.Serve(ln) }()

	select {
	case err := <-errc:
		return fmt.Errorf("serve: %w", err) // the server stopped on its own
	case <-ctx.Done():
	}

	// A fresh context: ctx is already cancelled and would allow no time at all.
	shutdownCtx, cancel := context.WithTimeout(context.Background(), grace)
	defer cancel()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		closeErr := srv.Close() // the grace period ran out: cut the remaining connections
		return errors.Join(fmt.Errorf("shutdown: %w", err), closeErr)
	}
	if err := <-errc; !errors.Is(err, http.ErrServerClosed) {
		return fmt.Errorf("serve: %w", err)
	}
	return nil
}
