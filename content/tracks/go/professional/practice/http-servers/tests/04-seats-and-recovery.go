import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
)

func Test(t *testing.T) {
	m := newMinibus(Trip{ID: "wed", Route: "Market town", Seats: 5})
	h := m.routes()
	seatPost := func(body string) int {
		rec := httptest.NewRecorder()
		h.ServeHTTP(rec, httptest.NewRequest("POST", "/trips/wed/bookings", strings.NewReader(body)))
		return rec.Code
	}
	check.Equal(seatPost(`{"passenger":"Ada","seats":3}`), 201, "booking 3 of 5 seats")
	check.Equal(seatPost(`{"passenger":"Bo","seats":3}`), 409, "booking 3 seats when 2 are free")
	check.Equal(seatPost(`{"passenger":"Bo","seats":2}`), 201, "booking exactly the seats that are free")
	check.Equal(seatPost(`{"passenger":"Cy","seats":1}`), 409, "booking a full trip")

	// Ten passengers try to book one seat each at the same time on a six-seat trip.
	busy := newMinibus(Trip{ID: "sat", Route: "Coast", Seats: 6})
	bh := busy.routes()
	var wg sync.WaitGroup
	codes := make([]int, 10)
	for i := range codes {
		wg.Go(func() {
			rec := httptest.NewRecorder()
			bh.ServeHTTP(rec, httptest.NewRequest("POST", "/trips/sat/bookings", strings.NewReader(`{"passenger":"P","seats":1}`)))
			codes[i] = rec.Code
		})
	}
	wg.Wait()
	created, conflicts := 0, 0
	for _, c := range codes {
		switch c {
		case 201:
			created++
		case 409:
			conflicts++
		}
	}
	check.Equal(created, 6, "concurrent bookings that succeed on a six-seat trip")
	check.Equal(conflicts, 4, "concurrent bookings refused with 409")
	rec := httptest.NewRecorder()
	bh.ServeHTTP(rec, httptest.NewRequest("GET", "/trips/sat", nil))
	var trip Trip
	check.NoError(json.Unmarshal(rec.Body.Bytes(), &trip), "the busy trip is still JSON")
	check.Equal(trip.Booked, 6, "seats booked after the concurrent rush")

	// recoverJSON turns a panic into a JSON 500 and leaves normal answers alone.
	boom := recoverJSON(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		panic("the timetable printer caught fire")
	}))
	rec = httptest.NewRecorder()
	boom.ServeHTTP(rec, httptest.NewRequest("GET", "/anything", nil))
	check.Equal(rec.Code, 500, "status after a handler panics")
	check.Equal(rec.Result().Header.Get("Content-Type"), "application/json", "Content-Type after a panic")
	var errBody map[string]string
	check.NoError(json.Unmarshal(rec.Body.Bytes(), &errBody), "the 500 body is a JSON object")
	check.True(errBody["error"] != "", "the 500 body has a non-empty \"error\" field")

	calm := recoverJSON(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusTeapot)
	}))
	rec = httptest.NewRecorder()
	calm.ServeHTTP(rec, httptest.NewRequest("GET", "/anything", nil))
	check.Equal(rec.Code, http.StatusTeapot, "recoverJSON passes a normal response through unchanged")
}
