package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"math/rand/v2"
	"net/http"
	"net/url"
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
	return f(r)
}

const (
	baseDelay = 100 * time.Millisecond
	maxDelay  = 2 * time.Second
)

// backoffCap returns the longest wait before retry n (1 for the first retry):
// 100 ms doubled for each earlier retry, never more than 2 s.
func backoffCap(n int) time.Duration {
	d := baseDelay
	for i := 1; i < n; i++ {
		d *= 2
		if d >= maxDelay {
			return maxDelay
		}
	}
	return d
}

// Forecast returns the readings for region, retrying network errors, 429 and 5xx.
func (c *PollenClient) Forecast(ctx context.Context, region string) ([]Reading, error) {
	u := c.BaseURL + "/regions/" + url.PathEscape(region) + "/forecast"
	var lastErr error
	for n := range c.Attempts {
		if n > 0 {
			if err := c.Wait(ctx, backoffCap(n)); err != nil {
				return nil, fmt.Errorf("forecast for %s: waiting to retry: %w", region, err)
			}
		}
		readings, retry, err := c.fetch(ctx, u)
		if err == nil {
			return readings, nil
		}
		if !retry {
			return nil, fmt.Errorf("forecast for %s: %w", region, err)
		}
		lastErr = err
	}
	return nil, fmt.Errorf("forecast for %s: after %d attempts: %w", region, c.Attempts, lastErr)
}

// fetch makes one attempt. retry reports whether another attempt might succeed.
func (c *PollenClient) fetch(ctx context.Context, u string) (readings []Reading, retry bool, err error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u, nil)
	if err != nil {
		return nil, false, err
	}
	req.Header.Set("Accept", "application/json")
	resp, err := c.HTTP.Do(req)
	if err != nil {
		return nil, true, err // the network failed; a GET is safe to send again
	}
	defer resp.Body.Close()

	switch {
	case resp.StatusCode == http.StatusOK:
		if err := json.NewDecoder(io.LimitReader(resp.Body, 1<<20)).Decode(&readings); err != nil {
			return nil, false, fmt.Errorf("decode forecast: %w", err)
		}
		return readings, false, nil
	case resp.StatusCode == http.StatusNotFound:
		return nil, false, ErrUnknownRegion
	case resp.StatusCode == http.StatusTooManyRequests || resp.StatusCode >= 500:
		return nil, true, fmt.Errorf("status %s", resp.Status)
	default:
		return nil, false, fmt.Errorf("unexpected status %s", resp.Status)
	}
}
