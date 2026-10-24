import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync/atomic"
	"time"
)

// statusServer answers every request with the statuses in order (the last one repeats);
// a 200 carries body. It counts requests and remembers the last Accept header.
type statusServer struct {
	statuses []int
	body     string
	hits     atomic.Int32
	accept   atomic.Value
	region   atomic.Value
}

func (s *statusServer) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	n := int(s.hits.Add(1))
	s.accept.Store(r.Header.Get("Accept"))
	s.region.Store(r.PathValue("region"))
	code := s.statuses[min(n, len(s.statuses))-1]
	if code != http.StatusOK {
		http.Error(w, http.StatusText(code), code)
		return
	}
	fmt.Fprint(w, s.body)
}

// statusCall runs Forecast against a fresh server and reports the readings, hits, waits and error.
func statusCall(s *statusServer, region string, attempts int) ([]Reading, int, []time.Duration, error) {
	mux := http.NewServeMux()
	mux.Handle("GET /api/regions/{region}/forecast", s)
	srv := httptest.NewServer(mux)
	defer srv.Close()
	var waits []time.Duration
	c := &PollenClient{
		BaseURL:  srv.URL + "/api",
		HTTP:     srv.Client(),
		Attempts: attempts,
		Wait: func(ctx context.Context, d time.Duration) error {
			waits = append(waits, d)
			return nil
		},
	}
	readings, err := c.Forecast(context.Background(), region)
	return readings, int(s.hits.Load()), waits, err
}

func Test(t *testing.T) {
	good := `[{"day":"2026-06-01","grass":4,"tree":1}]`

	s := &statusServer{statuses: []int{200}, body: good}
	readings, hits, waits, err := statusCall(s, "Kent", 3)
	check.NoError(err, "a 200 on the first attempt")
	check.Equal(readings, []Reading{{"2026-06-01", 4, 1}}, "readings from a 200")
	check.Equal(hits, 1, "requests for a 200 on the first attempt")
	check.Equal(len(waits), 0, "no wait before the first attempt")
	check.Equal(s.accept.Load(), "application/json", "the Accept header of the request")
	check.Equal(s.region.Load(), "Kent", "the region in the request path")

	s = &statusServer{statuses: []int{200}, body: good}
	_, _, _, err = statusCall(s, "Isle of Wight", 1)
	check.NoError(err, "a region with spaces")
	check.Equal(s.region.Load(), "Isle of Wight", "a region with spaces arrives as one path segment")

	s = &statusServer{statuses: []int{404}}
	_, hits, waits, err = statusCall(s, "Atlantis", 3)
	check.True(errors.Is(err, ErrUnknownRegion), "a 404 gives an error that wraps ErrUnknownRegion")
	check.Equal(hits, 1, "a 404 is not retried")
	check.Equal(len(waits), 0, "no wait after a 404")

	for _, code := range []int{400, 401, 403} {
		s = &statusServer{statuses: []int{code}}
		_, hits, _, err = statusCall(s, "Kent", 3)
		check.Error(err, "a status that is not 200 gives an error")
		check.True(err != nil && strings.Contains(err.Error(), fmt.Sprint(code)), "the error names the status it got")
		check.True(err != nil && !errors.Is(err, ErrUnknownRegion), "only a 404 wraps ErrUnknownRegion")
		check.Equal(hits, 1, "a 4xx status other than 429 is not retried")
	}

	s = &statusServer{statuses: []int{500}}
	_, hits, waits, err = statusCall(s, "Kent", 4)
	check.Error(err, "a server that always fails gives an error")
	check.Equal(hits, 4, "a 500 is retried until the attempts run out")
	check.Equal(waits, []time.Duration{100 * time.Millisecond, 200 * time.Millisecond, 400 * time.Millisecond}, "the waits between four attempts, and none after the last")

	s = &statusServer{statuses: []int{429, 502, 200}, body: good}
	readings, hits, waits, err = statusCall(s, "Kent", 3)
	check.NoError(err, "a 429 and a 502 before a 200")
	check.Equal(len(readings), 1, "readings after two retries")
	check.Equal(hits, 3, "requests for a 429, a 502 and a 200")
	check.Equal(len(waits), 2, "waits before the two retries")

	s = &statusServer{statuses: []int{503}}
	_, hits, waits, err = statusCall(s, "Kent", 1)
	check.Error(err, "one attempt that gets a 503")
	check.Equal(hits, 1, "with one attempt there is no retry")
	check.Equal(len(waits), 0, "with one attempt there is no wait")

	s = &statusServer{statuses: []int{200}, body: `[{"day":`}
	_, hits, _, err = statusCall(s, "Kent", 3)
	check.Error(err, "a 200 whose body is not valid JSON")
	check.Equal(hits, 1, "a bad JSON body is not retried")
}
