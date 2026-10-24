import (
	"bytes"
	"context"
	"errors"
	"net/http"
	"strings"
	"time"
)

// mooringFailingStore is a Store whose Get panics and whose Add fails.
type mooringFailingStore struct{ Store }

func (mooringFailingStore) Get(context.Context, string) (Booking, error) {
	panic("berth chart missing")
}

func (mooringFailingStore) Add(context.Context, Booking) (Booking, error) {
	return Booking{}, errors.New("disk full")
}

func Test(t *testing.T) {
	// logRequests on its own, around handlers that set the status in different ways.
	var logs bytes.Buffer
	logger := mooringLogger(&logs)
	teapot := logRequests(logger, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusTeapot)
	}))
	writesOnly := logRequests(logger, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("hello"))
	}))
	silent := logRequests(logger, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {}))

	rec := mooringCall(teapot, http.MethodGet, "/brew?strength=4", "", "Authorization", "Bearer "+mooringToken)
	check.Equal(rec.Code, http.StatusTeapot, "logRequests passes the handler's status on to the client")
	mooringCall(writesOnly, http.MethodPost, "/hello", "")
	mooringCall(silent, http.MethodDelete, "/nothing", "")
	records := mooringRecords(&logs)
	check.Equal(len(records), 3, "logRequests logs exactly one line per request")
	check.Equal(records[0], map[string]any{"level": "INFO", "msg": "request", "method": "GET", "path": "/brew", "status": 418.0},
		"the log line for a handler that calls WriteHeader (the path without the query)")
	check.Equal(records[1]["status"], any(200.0), "the status logged for a handler that only calls Write")
	check.Equal(records[2]["status"], any(200.0), "the status logged for a handler that writes nothing")
	check.True(!strings.Contains(logs.String(), mooringToken), "the Authorization header never reaches the log")
	check.True(!strings.Contains(logs.String(), "strength"), "the query string is not logged")

	// recoverPanics on its own.
	logs.Reset()
	boom := recoverPanics(logger, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		panic("tide table corrupt")
	}))
	rec = mooringCall(boom, http.MethodGet, "/tides", "")
	check.Equal(rec.Code, http.StatusInternalServerError, "the status after a handler panics")
	check.Equal(mooringError(rec), "internal error", "the error after a handler panics")
	records = mooringRecords(&logs)
	check.Equal(len(records), 1, "recoverPanics logs one line for a panic")
	check.Equal(records[0], map[string]any{"level": "ERROR", "msg": "panic", "path": "/tides", "panic": "tide table corrupt"},
		"the log line for a panic")
	calm := recoverPanics(logger, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusAccepted)
	}))
	check.Equal(mooringCall(calm, http.MethodGet, "/", "").Code, http.StatusAccepted, "recoverPanics changes nothing when there is no panic")

	// Both, in newServer: the panic is recovered inside the request log.
	logs.Reset()
	h := newServer(mooringConfig(), mooringFailingStore{newMemoryStore()}, logger)
	rec = mooringCall(h, http.MethodGet, "/bookings/b1", "")
	check.Equal(rec.Code, http.StatusInternalServerError, "newServer answers 500 when the store panics")
	records = mooringRecords(&logs)
	check.Equal(len(records), 2, "the log lines for a request whose handler panicked")
	check.Equal(records[0]["msg"], any("panic"), "the panic is logged first, by recoverPanics")
	check.Equal(records[1], map[string]any{"level": "INFO", "msg": "request", "method": "GET", "path": "/bookings/b1", "status": 500.0},
		"then the request is logged with status 500, by logRequests outside recoverPanics")

	logs.Reset()
	rec = mooringCall(h, http.MethodPost, "/bookings", mooringBody(nil))
	check.Equal(rec.Code, http.StatusInternalServerError, "newServer answers 500 when the store fails")
	check.Equal(mooringError(rec), "internal error", "the client is not told the store's error")
	check.True(strings.Contains(logs.String(), "disk full"), "the store's error is logged")

	srv := newHTTPServer(mooringConfig(), h)
	check.Equal(srv.Addr, ":8080", "the server's address comes from the configuration")
	check.True(srv.Handler != nil, "the server has the handler")
	check.Equal(srv.ReadHeaderTimeout, 5*time.Second, "the server's ReadHeaderTimeout")
	check.Equal(srv.ReadTimeout, 10*time.Second, "the server's ReadTimeout")
	check.Equal(srv.WriteTimeout, 10*time.Second, "the server's WriteTimeout")
	check.Equal(srv.IdleTimeout, 60*time.Second, "the server's IdleTimeout")
}
