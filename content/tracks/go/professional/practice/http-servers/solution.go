package main

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strings"
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
	// Headers must be set before WriteHeader; later changes are ignored.
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(v); err != nil {
		log.Printf("write response: %v", err) // the status is already sent
	}
}

// writeError sends {"error": msg} with the given status code.
func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}

// getTrip handles GET /trips/{id}.
func (m *minibus) getTrip(w http.ResponseWriter, r *http.Request) {
	m.mu.Lock()
	trip, ok := m.trips[r.PathValue("id")]
	var snapshot Trip
	if ok {
		snapshot = *trip
	}
	m.mu.Unlock()

	if !ok {
		writeError(w, http.StatusNotFound, "no such trip")
		return
	}
	writeJSON(w, http.StatusOK, snapshot)
}

// bookSeats handles POST /trips/{id}/bookings.
func (m *minibus) bookSeats(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	m.mu.Lock()
	_, known := m.trips[id]
	m.mu.Unlock()
	if !known {
		writeError(w, http.StatusNotFound, "no such trip")
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, maxBodyBytes)
	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()
	var req bookingRequest
	if err := dec.Decode(&req); err != nil {
		if _, ok := errors.AsType[*http.MaxBytesError](err); ok {
			writeError(w, http.StatusRequestEntityTooLarge, "body too large")
			return
		}
		writeError(w, http.StatusBadRequest, "invalid JSON: "+err.Error())
		return
	}
	if strings.TrimSpace(req.Passenger) == "" || req.Seats < 1 {
		writeError(w, http.StatusUnprocessableEntity, "passenger is required and seats must be at least 1")
		return
	}

	// Check and update under one lock, so two bookings cannot both take the last seat.
	m.mu.Lock()
	trip := m.trips[id]
	if trip.Booked+req.Seats > trip.Seats {
		m.mu.Unlock()
		writeError(w, http.StatusConflict, "not enough free seats")
		return
	}
	trip.Booked += req.Seats
	snapshot := *trip
	m.mu.Unlock()

	writeJSON(w, http.StatusCreated, snapshot)
}

// recoverJSON turns a panic in next into a 500 response with a JSON error body.
func recoverJSON(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if v := recover(); v != nil {
				log.Printf("panic serving %s %s: %v", r.Method, r.URL.Path, v)
				writeError(w, http.StatusInternalServerError, "internal error")
			}
		}()
		next.ServeHTTP(w, r)
	})
}

// routes registers the service's handlers and wraps them in the recovery middleware.
func (m *minibus) routes() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /trips/{id}", m.getTrip)
	mux.HandleFunc("POST /trips/{id}/bookings", m.bookSeats)
	return recoverJSON(mux)
}
