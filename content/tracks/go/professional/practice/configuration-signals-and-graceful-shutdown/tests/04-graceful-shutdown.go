import (
	"context"
	"errors"
	"io"
	"net"
	"net/http"
	"sync"
	"time"
)

// shutdownRig is a server whose /slow handler blocks until release is closed.
type shutdownRig struct {
	ln       net.Listener
	srv      *http.Server
	url      string
	started  chan struct{}
	release  chan struct{}
	shutdown chan struct{}
}

func newShutdownRig(t *testing.T) *shutdownRig {
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatalf("listen on loopback: %v", err)
	}
	rig := &shutdownRig{
		ln:       ln,
		url:      "http://" + ln.Addr().String() + "/slow",
		started:  make(chan struct{}),
		release:  make(chan struct{}),
		shutdown: make(chan struct{}),
	}
	var once sync.Once
	mux := http.NewServeMux()
	mux.HandleFunc("GET /slow", func(w http.ResponseWriter, r *http.Request) {
		once.Do(func() { close(rig.started) })
		<-rig.release
		io.WriteString(w, "rota saved")
	})
	rig.srv = &http.Server{Handler: mux}
	rig.srv.RegisterOnShutdown(func() { close(rig.shutdown) })
	return rig
}

// shutdownGet sends one GET on a fresh connection and reports the status, or an error.
func shutdownGet(url string) (int, string, error) {
	client := &http.Client{Timeout: 4 * time.Second, Transport: &http.Transport{DisableKeepAlives: true}}
	resp, err := client.Get(url)
	if err != nil {
		return 0, "", err
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	return resp.StatusCode, string(body), err
}

type shutdownResult struct {
	code int
	body string
	err  error
}

// shutdownWait waits for a value from ch, failing the test with what when it takes too long.
func shutdownWait[T any](t *testing.T, ch <-chan T, what string) T {
	select {
	case v := <-ch:
		return v
	case <-time.After(2 * time.Second):
		t.Fatalf("timed out: %s", what)
		var zero T
		return zero
	}
}

func Test(t *testing.T) {
	// 1. A request in flight finishes; new connections are refused; serve returns nil.
	rig := newShutdownRig(t)
	ctx, cancel := context.WithCancel(context.Background())
	served := make(chan error, 1)
	go func() { served <- serve(ctx, rig.srv, rig.ln, 2*time.Second) }()
	inFlight := make(chan shutdownResult, 1)
	go func() {
		code, body, err := shutdownGet(rig.url)
		inFlight <- shutdownResult{code, body, err}
	}()
	shutdownWait(t, rig.started, "the request did not reach the handler")
	cancel()
	shutdownWait(t, rig.shutdown, "srv.Shutdown was not called after the context was cancelled")
	_, _, err := shutdownGet(rig.url)
	check.Error(err, "a new connection after shutdown starts is refused")
	close(rig.release)
	got := shutdownWait(t, inFlight, "the request in flight did not finish")
	check.NoError(got.err, "the request in flight is not cut off")
	check.Equal(got.code, 200, "the status of the request in flight")
	check.Equal(got.body, "rota saved", "the body of the request in flight")
	check.NoError(shutdownWait(t, served, "serve did not return after a clean shutdown"), "serve after a clean shutdown")

	// 2. The grace period runs out: serve closes the server and reports the deadline.
	rig = newShutdownRig(t)
	ctx, cancel = context.WithCancel(context.Background())
	served = make(chan error, 1)
	go func() { served <- serve(ctx, rig.srv, rig.ln, 100*time.Millisecond) }()
	stuck := make(chan shutdownResult, 1)
	go func() {
		code, body, err := shutdownGet(rig.url)
		stuck <- shutdownResult{code, body, err}
	}()
	shutdownWait(t, rig.started, "the request did not reach the handler")
	cancel()
	err = shutdownWait(t, served, "serve did not return when the grace period ran out")
	check.True(errors.Is(err, context.DeadlineExceeded), "the error after the grace period wraps context.DeadlineExceeded")
	got = shutdownWait(t, stuck, "the stuck request was not cut off: call srv.Close after the grace period")
	check.True(got.err != nil || got.code != 200, "the stuck request does not succeed")
	close(rig.release)

	// 3. A server that cannot serve: serve returns its error without waiting for ctx.
	rig = newShutdownRig(t)
	rig.ln.Close()
	served = make(chan error, 1)
	go func() { served <- serve(context.Background(), rig.srv, rig.ln, time.Second) }()
	err = shutdownWait(t, served, "serve did not return when Serve failed on its own")
	check.Error(err, "serve reports a listener that fails")
	check.True(!errors.Is(err, http.ErrServerClosed), "a failed listener is not reported as a clean close")
}
