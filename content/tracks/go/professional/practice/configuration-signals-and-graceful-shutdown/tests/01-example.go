import (
	"context"
	"errors"
	"io"
	"net"
	"net/http"
	"strings"
	"time"
)

func Test(t *testing.T) {
	env := map[string]string{"ROTA_WORKERS": "8", "ROTA_API_KEY": "k-71"}
	lookup := func(k string) (string, bool) { v, ok := env[k]; return v, ok }

	cfg, err := loadConfig([]string{"-workers", "2"}, lookup, io.Discard)
	check.NoError(err, "loadConfig with -workers 2 and an API key in the environment")
	check.Equal(cfg, Config{Addr: "127.0.0.1:8080", Grace: 10 * time.Second, Workers: 2, APIKey: "k-71"}, "the config of the first example")

	_, err = loadConfig([]string{"-workers", "0"}, func(string) (string, bool) { return "", false }, io.Discard)
	check.True(errors.Is(err, ErrConfig), "zero workers and no API key give an error that wraps ErrConfig")
	if err != nil {
		check.True(strings.Contains(err.Error(), "workers") && strings.Contains(err.Error(), "ROTA_API_KEY"), "the error mentions both problems")
	}
	check.Equal(exitCode(err), 2, "the exit code for a configuration error")

	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatalf("listen on loopback: %v", err)
	}
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	done := make(chan error, 1)
	go func() { done <- serve(ctx, &http.Server{Handler: http.NotFoundHandler()}, ln, time.Second) }()
	select {
	case err := <-done:
		check.NoError(err, "serve with a cancelled context and no requests")
	case <-time.After(3 * time.Second):
		t.Fatal("serve did not return after its context was cancelled")
	}
}
