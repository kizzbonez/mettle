package main

import (
	"context"
	"errors"
	"math/rand/v2"
	"net/http"
	"time"
)

// Reading is one day's pollen forecast for a region.
type Reading struct {
	Day   string `json:"day"`
	Grass int    `json:"grass"`
	Tree  int    `json:"tree"`
}

// ErrUnknownRegion is returned when the API does not know a region (HTTP 404).
var ErrUnknownRegion = errors.New("unknown region")

// PollenClient fetches forecasts from the regional pollen API.
type PollenClient struct {
	BaseURL  string       // for example "http://127.0.0.1:4321/api"
	HTTP     *http.Client // must have a Timeout in production
	Attempts int          // total attempts per call, at least 1
	// Wait pauses before a retry for up to d, or returns an error when ctx ends.
	Wait func(ctx context.Context, d time.Duration) error
}

// newPollenClient returns a client with production settings.
func newPollenClient(baseURL string) *PollenClient {
	return &PollenClient{
		BaseURL:  baseURL,
		HTTP:     &http.Client{Timeout: 5 * time.Second},
		Attempts: 3,
		Wait:     jitterWait,
	}
}

// jitterWait sleeps for a random duration between 0 and d ("full jitter"), or until ctx ends.
func jitterWait(ctx context.Context, d time.Duration) error {
	t := time.NewTimer(rand.N(d + 1))
	defer t.Stop()
	select {
	case <-t.C:
		return nil
	case <-ctx.Done():
		return ctx.Err()
	}
}

// roundTripFunc lets a plain function act as an http.RoundTripper.
type roundTripFunc func(*http.Request) (*http.Response, error)

// RoundTrip calls f.
func (f roundTripFunc) RoundTrip(r *http.Request) (*http.Response, error) {
	panic("not implemented")
}

// backoffCap returns the longest wait before retry n (1 for the first retry):
// 100 ms doubled for each earlier retry, never more than 2 s.
func backoffCap(n int) time.Duration {
	panic("not implemented")
}

// Forecast returns the readings for region, retrying network errors, 429 and 5xx.
func (c *PollenClient) Forecast(ctx context.Context, region string) ([]Reading, error) {
	panic("not implemented")
}
