import (
	"errors"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"
)

func Test(t *testing.T) {
	ms := time.Millisecond
	steps := []struct {
		n    int
		want time.Duration
	}{
		{1, 100 * ms}, {2, 200 * ms}, {3, 400 * ms}, {4, 800 * ms}, {5, 1600 * ms},
		{6, 2 * time.Second}, {7, 2 * time.Second}, {40, 2 * time.Second},
		{64, 2 * time.Second}, {1000, 2 * time.Second},
	}
	for _, s := range steps {
		got := backoffCap(s.n)
		check.Equal(got, s.want, "backoffCap for retry "+strconv.Itoa(s.n))
	}

	var seen *http.Request
	canned := &http.Response{StatusCode: http.StatusTeapot, Body: io.NopCloser(strings.NewReader("tea"))}
	var rt http.RoundTripper = roundTripFunc(func(r *http.Request) (*http.Response, error) {
		seen = r
		return canned, nil
	})
	req, err := http.NewRequest("GET", "http://pollen.example/x", nil)
	check.NoError(err, "building a request")
	resp, err := rt.RoundTrip(req)
	check.NoError(err, "RoundTrip with a function that succeeds")
	check.True(resp == canned, "RoundTrip returns the function's response")
	check.True(seen == req, "RoundTrip passes the request to the function")

	failure := errors.New("cable cut")
	rt = roundTripFunc(func(r *http.Request) (*http.Response, error) { return nil, failure })
	_, err = rt.RoundTrip(req)
	check.ErrorIs(err, failure, "RoundTrip returns the function's error")

	client := &http.Client{Transport: roundTripFunc(func(r *http.Request) (*http.Response, error) {
		return &http.Response{StatusCode: 200, Body: io.NopCloser(strings.NewReader("ok")), Request: r}, nil
	})}
	resp, err = client.Get("http://pollen.example/y")
	if err != nil {
		t.Fatalf("a Client with a roundTripFunc transport failed: %v", err)
	}
	body, err := io.ReadAll(resp.Body)
	resp.Body.Close()
	check.NoError(err, "reading the fake body")
	check.Equal(string(body), "ok", "the body from the fake transport")
}
