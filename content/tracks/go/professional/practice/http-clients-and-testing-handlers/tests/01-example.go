import (
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"
	"sync"
	"time"
)

func Test(t *testing.T) {
	var mu sync.Mutex
	var paths []string
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		mu.Lock()
		paths = append(paths, r.Method+" "+r.URL.EscapedPath())
		first := len(paths) == 1
		mu.Unlock()
		if first {
			http.Error(w, "busy", http.StatusServiceUnavailable)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprint(w, `[{"day":"2026-05-14","grass":7,"tree":3},{"day":"2026-05-15","grass":9,"tree":2}]`)
	}))
	defer srv.Close()

	var waits []time.Duration
	c := &PollenClient{
		BaseURL:  srv.URL + "/api",
		HTTP:     srv.Client(),
		Attempts: 3,
		Wait: func(ctx context.Context, d time.Duration) error {
			waits = append(waits, d)
			return nil
		},
	}
	readings, err := c.Forecast(context.Background(), "Isle of Wight")
	check.NoError(err, "Forecast for the Isle of Wight after one 503")
	check.Equal(readings, []Reading{{"2026-05-14", 7, 3}, {"2026-05-15", 9, 2}}, "the decoded readings")
	check.Equal(waits, []time.Duration{100 * time.Millisecond}, "the waits before each retry")
	mu.Lock()
	defer mu.Unlock()
	want := "GET /api/regions/Isle%20of%20Wight/forecast"
	check.Equal(paths, []string{want, want}, "the requests the server saw")
}
