package main

import (
	"context"
	"errors"
	"io"
	"net"
	"net/http"
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
	panic("not implemented")
}

// exitCode maps the error that ended the program to its exit status.
func exitCode(err error) int {
	panic("not implemented")
}

// serve runs srv on ln until ctx is cancelled, then shuts it down gracefully,
// giving requests in flight up to grace to finish.
func serve(ctx context.Context, srv *http.Server, ln net.Listener, grace time.Duration) error {
	panic("not implemented")
}
