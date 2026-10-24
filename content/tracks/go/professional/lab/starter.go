// Command moorings is the visitor moorings service of Saltwick harbour.
package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"sync"
	"syscall"
	"time"
)

// version is set at build time with -ldflags "-X main.version=...".
var version = "dev"

// ---------------------------------------------------------------------------
// Given: the bookings and their store.

// Booking is one visiting boat's stay on a berth.
type Booking struct {
	ID      string  `json:"id"`
	Boat    string  `json:"boat"`
	LengthM float64 `json:"length_m"`
	Berth   int     `json:"berth"`
	Arrive  string  `json:"arrive"` // a date such as "2026-07-04"
	Nights  int     `json:"nights"`
}

// Errors a Store returns.
var (
	ErrNotFound   = errors.New("booking not found")
	ErrBerthTaken = errors.New("berth is taken for those nights")
)

// Store keeps the bookings. The harbour runs the service with memoryStore;
// a database/sql version would satisfy the same interface.
type Store interface {
	// Add stores a new booking, gives it an ID and returns it. It returns
	// ErrBerthTaken when another booking has the berth on one of the nights.
	Add(ctx context.Context, b Booking) (Booking, error)
	// Get returns the booking with the given ID, or ErrNotFound.
	Get(ctx context.Context, id string) (Booking, error)
	// Cancel removes the booking with the given ID, or returns ErrNotFound.
	Cancel(ctx context.Context, id string) error
}

// memoryStore is a Store in memory, safe for concurrent use.
type memoryStore struct {
	mu       sync.Mutex
	last     int
	bookings map[string]Booking
}

func newMemoryStore() *memoryStore {
	return &memoryStore{bookings: map[string]Booking{}}
}

// Add stores b with the next ID: "b1", "b2" and so on.
func (s *memoryStore) Add(_ context.Context, b Booking) (Booking, error) {
	start, err := time.Parse(time.DateOnly, b.Arrive)
	if err != nil {
		return Booking{}, err
	}
	end := start.AddDate(0, 0, b.Nights)
	s.mu.Lock()
	defer s.mu.Unlock()
	for _, other := range s.bookings {
		otherStart, _ := time.Parse(time.DateOnly, other.Arrive)
		otherEnd := otherStart.AddDate(0, 0, other.Nights)
		if other.Berth == b.Berth && start.Before(otherEnd) && otherStart.Before(end) {
			return Booking{}, ErrBerthTaken
		}
	}
	s.last++
	b.ID = "b" + strconv.Itoa(s.last)
	s.bookings[b.ID] = b
	return b, nil
}

// Get returns the booking with the given ID.
func (s *memoryStore) Get(_ context.Context, id string) (Booking, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	b, ok := s.bookings[id]
	if !ok {
		return Booking{}, ErrNotFound
	}
	return b, nil
}

// Cancel removes the booking with the given ID.
func (s *memoryStore) Cancel(_ context.Context, id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, ok := s.bookings[id]; !ok {
		return ErrNotFound
	}
	delete(s.bookings, id)
	return nil
}

// writeJSON writes v as JSON with the given status code.
func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v) // an error means the client has gone: nothing left to do
}

// writeError writes {"error": message} with the given status code.
func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}

// Config is the service's configuration.
type Config struct {
	Addr       string // the address to listen on
	Berths     int    // visitor berths, numbered from 1
	MaxBody    int64  // the largest request body accepted, in bytes
	AdminToken string // the token that may cancel bookings
}

// bookingRequest is the body of POST /bookings. It has no ID: the store
// assigns it, so a request that sends one is refused as an unknown field.
type bookingRequest struct {
	Boat    string  `json:"boat"`
	LengthM float64 `json:"length_m"`
	Berth   int     `json:"berth"`
	Arrive  string  `json:"arrive"`
	Nights  int     `json:"nights"`
}

// ---------------------------------------------------------------------------
// Task 1: loadConfig reads the configuration from flags, then the environment,
// then the defaults. The admin token comes only from the environment.
func loadConfig(args []string, getenv func(string) (string, bool)) (Config, error) {
	panic("not implemented")
}

// ---------------------------------------------------------------------------
// Task 2: newServer returns the service's handler: the routes on a ServeMux,
// wrapped in recoverPanics and, outside that, logRequests.
func newServer(cfg Config, store Store, logger *slog.Logger) http.Handler {
	panic("not implemented")
}

// ---------------------------------------------------------------------------
// Task 3: middleware.

// logRequests logs one line per request, after it has been handled.
func logRequests(logger *slog.Logger, next http.Handler) http.Handler {
	panic("not implemented")
}

// recoverPanics turns a panic in a handler into a logged error and a 500.
func recoverPanics(logger *slog.Logger, next http.Handler) http.Handler {
	panic("not implemented")
}

// ---------------------------------------------------------------------------
// Task 4: newHTTPServer returns a server for h with timeouts.
func newHTTPServer(cfg Config, h http.Handler) *http.Server {
	panic("not implemented")
}

// ---------------------------------------------------------------------------
// Given: main wires everything together and shuts down gracefully.

func main() {
	cfg, err := loadConfig(os.Args[1:], os.LookupEnv)
	if err != nil {
		fmt.Fprintln(os.Stderr, "moorings:", err)
		os.Exit(2)
	}
	logger := slog.New(slog.NewJSONHandler(os.Stderr, nil))
	srv := newHTTPServer(cfg, newServer(cfg, newMemoryStore(), logger))

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	failed := make(chan error, 1)
	go func() { failed <- srv.ListenAndServe() }()
	logger.Info("listening", "addr", cfg.Addr, "version", version)

	select {
	case err := <-failed:
		logger.Error("server stopped", "err", err)
		os.Exit(1)
	case <-ctx.Done():
		logger.Info("shutting down", "cause", context.Cause(ctx))
	}
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		logger.Error("shutdown", "err", err)
		os.Exit(1)
	}
}
