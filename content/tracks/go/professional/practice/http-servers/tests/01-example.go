import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
)

// exampleDo sends one request to h and returns the recorded response.
func exampleDo(h http.Handler, method, path, body string) *httptest.ResponseRecorder {
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, httptest.NewRequest(method, path, strings.NewReader(body)))
	return rec
}

func Test(t *testing.T) {
	h := newMinibus(Trip{ID: "tue", Route: "Market town", Seats: 8}).routes()

	rec := exampleDo(h, "GET", "/trips/tue", "")
	check.Equal(rec.Code, 200, "status of GET /trips/tue")
	var trip Trip
	check.NoError(json.Unmarshal(rec.Body.Bytes(), &trip), "GET /trips/tue answers with a JSON trip")
	check.Equal(trip, Trip{ID: "tue", Route: "Market town", Seats: 8}, "the trip from GET /trips/tue")

	rec = exampleDo(h, "POST", "/trips/tue/bookings", `{"passenger":"Ines","seats":3}`)
	check.Equal(rec.Code, 201, "status of booking 3 seats for Ines")
	trip = Trip{}
	check.NoError(json.Unmarshal(rec.Body.Bytes(), &trip), "a booking answers with the updated trip as JSON")
	check.Equal(trip.Booked, 3, "booked seats after the booking for Ines")

	rec = exampleDo(h, "POST", "/trips/tue/bookings", `{"passenger":"Ola","seats":6}`)
	check.Equal(rec.Code, 409, "status of booking 6 seats when 5 are free")

	rec = exampleDo(h, "GET", "/trips/sat", "")
	check.Equal(rec.Code, 404, "status of GET for a trip that does not exist")

	rec = exampleDo(h, "DELETE", "/trips/tue", "")
	check.Equal(rec.Code, 405, "status of DELETE /trips/tue")
}
