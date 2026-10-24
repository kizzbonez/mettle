package main

import (
	"net/http"
	"sync"
)

// maxBodyBytes is the largest booking body the service reads.
const maxBodyBytes = 1 << 10

// Trip is one run of the village minibus.
type Trip struct {
	ID     string `json:"id"`
	Route  string `json:"route"`
	Seats  int    `json:"seats"`
	Booked int    `json:"booked"`
}

// bookingRequest is the JSON body of POST /trips/{id}/bookings.
type bookingRequest struct {
	Passenger string `json:"passenger"`
	Seats     int    `json:"seats"`
}

// minibus holds the trips. Handlers may run concurrently, so mu guards trips.
type minibus struct {
	mu    sync.Mutex
	trips map[string]*Trip
}

// newMinibus returns a service that knows the given trips.
func newMinibus(trips ...Trip) *minibus {
	m := &minibus{trips: make(map[string]*Trip, len(trips))}
	for _, t := range trips {
		m.trips[t.ID] = &t
	}
	return m
}

// writeJSON sends v as JSON with the given status code.
func writeJSON(w http.ResponseWriter, status int, v any) {
	panic("not implemented")
}

// writeError sends {"error": msg} with the given status code.
func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}

// getTrip handles GET /trips/{id}.
func (m *minibus) getTrip(w http.ResponseWriter, r *http.Request) {
	panic("not implemented")
}

// bookSeats handles POST /trips/{id}/bookings.
func (m *minibus) bookSeats(w http.ResponseWriter, r *http.Request) {
	panic("not implemented")
}

// recoverJSON turns a panic in next into a 500 response with a JSON error body.
func recoverJSON(next http.Handler) http.Handler {
	panic("not implemented")
}

// routes registers the service's handlers and wraps them in the recovery middleware.
func (m *minibus) routes() http.Handler {
	panic("not implemented")
}
