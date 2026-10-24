// Command moorings is the visitor moorings service of Saltwick harbour.
package main

import (
	"context"
	"crypto/subtle"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"strings"
	"sync"
	"syscall"
	"time"
	"unicode/utf8"
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

// ---------------------------------------------------------------------------
// Task 1: configuration.

// Config is the service's configuration.
type Config struct {
	Addr       string // the address to listen on
	Berths     int    // visitor berths, numbered from 1
	MaxBody    int64  // the largest request body accepted, in bytes
	AdminToken string // the token that may cancel bookings
}

// loadConfig reads the configuration from command-line flags and the
// environment, in that order of precedence, over the defaults. The admin token
// is a secret, so it comes only from the environment.
func loadConfig(args []string, getenv func(string) (string, bool)) (Config, error) {
	cfg := Config{Addr: ":8080", Berths: 12, MaxBody: 4096}
	if v, ok := getenv("MOORINGS_ADDR"); ok {
		cfg.Addr = v
	}
	if v, ok := getenv("MOORINGS_BERTHS"); ok {
		n, err := strconv.Atoi(v)
		if err != nil {
			return Config{}, fmt.Errorf("MOORINGS_BERTHS: %q is not a number", v)
		}
		cfg.Berths = n
	}
	if v, ok := getenv("MOORINGS_MAX_BODY"); ok {
		n, err := strconv.ParseInt(v, 10, 64)
		if err != nil {
			return Config{}, fmt.Errorf("MOORINGS_MAX_BODY: %q is not a number", v)
		}
		cfg.MaxBody = n
	}
	cfg.AdminToken, _ = getenv("MOORINGS_ADMIN_TOKEN")

	// The values found so far become the flags' defaults, so a flag wins.
	fs := flag.NewFlagSet("moorings", flag.ContinueOnError)
	fs.SetOutput(io.Discard)
	fs.StringVar(&cfg.Addr, "addr", cfg.Addr, "address to listen on")
	fs.IntVar(&cfg.Berths, "berths", cfg.Berths, "number of visitor berths")
	fs.Int64Var(&cfg.MaxBody, "max-body", cfg.MaxBody, "largest request body in bytes")
	if err := fs.Parse(args); err != nil {
		return Config{}, err
	}

	switch {
	case cfg.Berths < 1 || cfg.Berths > 200:
		return Config{}, errors.New("berths must be between 1 and 200")
	case cfg.MaxBody < 256 || cfg.MaxBody > 1<<20:
		return Config{}, errors.New("max-body must be between 256 and 1048576")
	case len(cfg.AdminToken) < 16:
		return Config{}, errors.New("MOORINGS_ADMIN_TOKEN must be set to at least 16 characters")
	}
	return cfg, nil
}

// ---------------------------------------------------------------------------
// Task 2: the handlers.

// bookingRequest is the body of POST /bookings. It has no ID: the store
// assigns it, so a request that sends one is refused as an unknown field.
type bookingRequest struct {
	Boat    string  `json:"boat"`
	LengthM float64 `json:"length_m"`
	Berth   int     `json:"berth"`
	Arrive  string  `json:"arrive"`
	Nights  int     `json:"nights"`
}

// service holds what the handlers need.
type service struct {
	cfg    Config
	store  Store
	logger *slog.Logger
}

func (s *service) health(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok", "version": version})
}

func (s *service) createBooking(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, s.cfg.MaxBody)
	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()
	var req bookingRequest
	err := dec.Decode(&req)
	if err == nil && dec.Decode(&struct{}{}) != io.EOF {
		err = errors.New("more than one JSON value")
	}
	if err != nil {
		if _, ok := errors.AsType[*http.MaxBytesError](err); ok {
			writeError(w, http.StatusRequestEntityTooLarge, "request body too large")
			return
		}
		writeError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}

	b, problem := s.validate(req)
	if problem != "" {
		writeError(w, http.StatusUnprocessableEntity, problem)
		return
	}
	b, err = s.store.Add(r.Context(), b)
	if errors.Is(err, ErrBerthTaken) {
		writeError(w, http.StatusConflict, ErrBerthTaken.Error())
		return
	}
	if err != nil {
		s.internalError(w, r, err)
		return
	}
	w.Header().Set("Location", "/bookings/"+b.ID)
	writeJSON(w, http.StatusCreated, b)
}

// validate checks a request in a fixed order and returns the booking, or the
// first problem found.
func (s *service) validate(req bookingRequest) (Booking, string) {
	boat := strings.TrimSpace(req.Boat)
	switch {
	case boat == "":
		return Booking{}, "boat is required"
	case utf8.RuneCountInString(boat) > 40:
		return Booking{}, "boat must be at most 40 characters"
	case req.LengthM <= 0 || req.LengthM > 20:
		return Booking{}, "length_m must be more than 0 and at most 20"
	case req.Berth < 1 || req.Berth > s.cfg.Berths:
		return Booking{}, fmt.Sprintf("berth must be between 1 and %d", s.cfg.Berths)
	}
	if _, err := time.Parse(time.DateOnly, req.Arrive); err != nil {
		return Booking{}, "arrive must be a date like 2026-07-04"
	}
	if req.Nights < 1 || req.Nights > 14 {
		return Booking{}, "nights must be between 1 and 14"
	}
	return Booking{Boat: boat, LengthM: req.LengthM, Berth: req.Berth, Arrive: req.Arrive, Nights: req.Nights}, ""
}

func (s *service) getBooking(w http.ResponseWriter, r *http.Request) {
	b, err := s.store.Get(r.Context(), r.PathValue("id"))
	if errors.Is(err, ErrNotFound) {
		writeError(w, http.StatusNotFound, ErrNotFound.Error())
		return
	}
	if err != nil {
		s.internalError(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, b)
}

func (s *service) cancelBooking(w http.ResponseWriter, r *http.Request) {
	if !s.authorized(r) {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	err := s.store.Cancel(r.Context(), r.PathValue("id"))
	if errors.Is(err, ErrNotFound) {
		writeError(w, http.StatusNotFound, ErrNotFound.Error())
		return
	}
	if err != nil {
		s.internalError(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// authorized reports whether the request carries "Authorization: Bearer
// <admin token>". The token is compared in constant time.
func (s *service) authorized(r *http.Request) bool {
	token, ok := strings.CutPrefix(r.Header.Get("Authorization"), "Bearer ")
	return ok && subtle.ConstantTimeCompare([]byte(token), []byte(s.cfg.AdminToken)) == 1
}

// internalError logs an unexpected error and answers 500 without details.
func (s *service) internalError(w http.ResponseWriter, r *http.Request, err error) {
	s.logger.ErrorContext(r.Context(), "internal error", "path", r.URL.Path, "err", err)
	writeError(w, http.StatusInternalServerError, "internal error")
}

// newServer returns the service's handler: the routes, wrapped in panic
// recovery and, outside that, request logging.
func newServer(cfg Config, store Store, logger *slog.Logger) http.Handler {
	s := &service{cfg: cfg, store: store, logger: logger}
	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", s.health)
	mux.HandleFunc("POST /bookings", s.createBooking)
	mux.HandleFunc("GET /bookings/{id}", s.getBooking)
	mux.HandleFunc("DELETE /bookings/{id}", s.cancelBooking)
	return logRequests(logger, recoverPanics(logger, mux))
}

// ---------------------------------------------------------------------------
// Task 3: middleware.

// statusRecorder remembers the status code a handler sends.
type statusRecorder struct {
	http.ResponseWriter
	status int
}

func (rec *statusRecorder) WriteHeader(status int) {
	if rec.status == 0 {
		rec.status = status
	}
	rec.ResponseWriter.WriteHeader(status)
}

func (rec *statusRecorder) Write(p []byte) (int, error) {
	if rec.status == 0 {
		rec.status = http.StatusOK
	}
	return rec.ResponseWriter.Write(p)
}

// Unwrap lets http.ResponseController reach the underlying writer.
func (rec *statusRecorder) Unwrap() http.ResponseWriter { return rec.ResponseWriter }

// logRequests logs one line per request, after it has been handled. It logs
// the path without the query, and no headers: they may hold secrets.
func logRequests(logger *slog.Logger, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		rec := &statusRecorder{ResponseWriter: w}
		next.ServeHTTP(rec, r)
		if rec.status == 0 {
			rec.status = http.StatusOK // the handler wrote nothing
		}
		logger.InfoContext(r.Context(), "request", "method", r.Method, "path", r.URL.Path, "status", rec.status)
	})
}

// recoverPanics turns a panic in a handler into a logged error and a 500.
func recoverPanics(logger *slog.Logger, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			v := recover()
			if v == nil {
				return
			}
			if v == http.ErrAbortHandler {
				panic(v) // the server's own signal to abort the response
			}
			logger.ErrorContext(r.Context(), "panic", "path", r.URL.Path, "panic", fmt.Sprint(v))
			writeError(w, http.StatusInternalServerError, "internal error")
		}()
		next.ServeHTTP(w, r)
	})
}

// ---------------------------------------------------------------------------
// Task 4: the HTTP server.

// newHTTPServer returns a server for h with timeouts, so that slow or idle
// clients cannot hold connections forever.
func newHTTPServer(cfg Config, h http.Handler) *http.Server {
	return &http.Server{
		Addr:              cfg.Addr,
		Handler:           h,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       10 * time.Second,
		WriteTimeout:      10 * time.Second,
		IdleTimeout:       60 * time.Second,
	}
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
