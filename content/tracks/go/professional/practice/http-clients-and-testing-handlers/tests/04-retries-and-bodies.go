import (
	"context"
	"errors"
	"io"
	"net/http"
	"strings"
	"time"
)

// trackedBody is a response body that counts how often it is closed.
type trackedBody struct {
	io.Reader
	closes *int
}

func (b trackedBody) Close() error {
	*b.closes++
	return nil
}

// fakeStep is what the fake transport does for one request: fail, or answer with a status.
type fakeStep struct {
	fail error
	code int
	body string
}

// fakeClient returns a client whose transport plays the steps in order, counting requests
// and body closes, and remembering each request's context.
func fakeClient(steps []fakeStep, requests, closes *int, ctxs *[]context.Context) *http.Client {
	return &http.Client{Transport: roundTripFunc(func(r *http.Request) (*http.Response, error) {
		step := steps[min(*requests, len(steps)-1)]
		*requests++
		*ctxs = append(*ctxs, r.Context())
		if step.fail != nil {
			return nil, step.fail
		}
		return &http.Response{
			StatusCode: step.code,
			Status:     http.StatusText(step.code),
			Header:     http.Header{"Content-Type": {"application/json"}},
			Body:       trackedBody{Reader: strings.NewReader(step.body), closes: closes},
			Request:    r,
		}, nil
	})}
}

type ctxKeyPollen struct{}

func Test(t *testing.T) {
	good := `[{"day":"2026-06-02","grass":6,"tree":2}]`
	reset := errors.New("connection reset by peer")

	var requests, closes int
	var ctxs []context.Context
	var waits []time.Duration
	c := &PollenClient{
		BaseURL:  "http://pollen.example/api",
		HTTP:     fakeClient([]fakeStep{{fail: reset}, {fail: reset}, {code: 200, body: good}}, &requests, &closes, &ctxs),
		Attempts: 3,
		Wait: func(ctx context.Context, d time.Duration) error {
			waits = append(waits, d)
			return nil
		},
	}
	ctx := context.WithValue(context.Background(), ctxKeyPollen{}, "caller")
	readings, err := c.Forecast(ctx, "Kent")
	check.NoError(err, "two network failures and then a 200")
	check.Equal(readings, []Reading{{"2026-06-02", 6, 2}}, "readings after network failures")
	check.Equal(requests, 3, "network failures are retried")
	check.Equal(waits, []time.Duration{100 * time.Millisecond, 200 * time.Millisecond}, "waits before the two retries")
	check.Equal(closes, 1, "the one response body is closed")
	for _, rc := range ctxs {
		check.Equal(rc.Value(ctxKeyPollen{}), any("caller"), "every request carries the caller's context")
	}

	requests, closes, ctxs, waits = 0, 0, nil, nil
	c.HTTP = fakeClient([]fakeStep{{code: 503, body: "busy"}, {code: 429, body: "slow down"}, {code: 200, body: good}}, &requests, &closes, &ctxs)
	_, err = c.Forecast(context.Background(), "Kent")
	check.NoError(err, "a 503 and a 429 before a 200")
	check.Equal(closes, 3, "the bodies of retried responses are closed too")

	requests, closes, ctxs, waits = 0, 0, nil, nil
	c.HTTP = fakeClient([]fakeStep{{code: 404, body: "no"}}, &requests, &closes, &ctxs)
	_, err = c.Forecast(context.Background(), "Kent")
	check.True(errors.Is(err, ErrUnknownRegion), "a 404 through the fake transport")
	check.Equal(closes, 1, "the body of an error response is closed")

	requests, closes, ctxs, waits = 0, 0, nil, nil
	c.HTTP = fakeClient([]fakeStep{{fail: reset}}, &requests, &closes, &ctxs)
	_, err = c.Forecast(context.Background(), "Kent")
	check.Error(err, "a network that never comes back")
	check.Equal(requests, 3, "attempts against a network that never comes back")
	check.Equal(len(waits), 2, "waits between three failed attempts")

	requests, closes, ctxs, waits = 0, 0, nil, nil
	c.HTTP = fakeClient([]fakeStep{{code: 500, body: "oops"}}, &requests, &closes, &ctxs)
	c.Wait = func(ctx context.Context, d time.Duration) error {
		waits = append(waits, d)
		return context.Canceled
	}
	_, err = c.Forecast(context.Background(), "Kent")
	check.ErrorIs(err, context.Canceled, "a Wait that fails stops the retries and its error is wrapped")
	check.Equal(requests, 1, "no request is sent after Wait fails")
	check.Equal(len(waits), 1, "Wait is called once before it fails")
}
