Complete the service in `solution.go`. The types `Trip`, `bookingRequest` and `minibus`, the
constructor `newMinibus` and the helper `writeError` are written for you; keep them. Handlers can
run at the same time, so every read or change of `m.trips` must hold `m.mu`.

1. **`writeJSON(w http.ResponseWriter, status int, v any)`** sends `v` encoded as JSON with the
   header `Content-Type: application/json` and the given status code. (`writeError` uses it to
   send `{"error": "..."}`.)
2. **`(m *minibus) getTrip(w http.ResponseWriter, r *http.Request)`** serves
   `GET /trips/{id}`: status 200 with the trip as JSON, or 404 with an error body when there is
   no trip with that ID.
3. **`(m *minibus) bookSeats(w http.ResponseWriter, r *http.Request)`** serves
   `POST /trips/{id}/bookings` with a body like `{"passenger": "Ines", "seats": 2}`. Check, in
   this order, and answer with an error body:
   - no trip with that ID: **404**;
   - a body over **1,024 bytes** (use `http.MaxBytesReader`): **413**;
   - a body that is not valid JSON, or has any field other than `passenger` and `seats`: **400**;
   - a `passenger` that is empty or only spaces, or `seats` below 1: **422**;
   - more seats than are still free (`Seats - Booked`): **409**, and nothing is booked.

   Otherwise add the seats to `Booked` and answer **201** with the updated trip as JSON. Two
   requests must never both get the last seat.
4. **`recoverJSON(next http.Handler) http.Handler`** calls `next`; if it panics, answer **500**
   with an error body instead.
5. **`(m *minibus) routes() http.Handler`** returns a new `http.ServeMux` with the two patterns
   above (method included, so other methods get 405 from the mux), wrapped in `recoverJSON`.

```go
m := newMinibus(Trip{ID: "tue", Route: "Market town", Seats: 8})
h := m.routes()

// GET /trips/tue
// 200 {"id":"tue","route":"Market town","seats":8,"booked":0}

// POST /trips/tue/bookings  {"passenger":"Ines","seats":3}
// 201 {"id":"tue","route":"Market town","seats":8,"booked":3}

// POST /trips/tue/bookings  {"passenger":"Ola","seats":6}
// 409 {"error":"..."}       (only 5 seats are free)

// GET /trips/sat
// 404 {"error":"..."}

// DELETE /trips/tue
// 405
```

Test your handlers without a network: `rec := httptest.NewRecorder()`, then
`h.ServeHTTP(rec, httptest.NewRequest("POST", "/trips/tue/bookings", strings.NewReader(body)))`,
and read `rec.Code`, `rec.Header()` and `rec.Body`.
