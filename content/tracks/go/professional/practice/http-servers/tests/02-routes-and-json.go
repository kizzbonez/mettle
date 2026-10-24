import (
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
)

func Test(t *testing.T) {
	m := newMinibus(
		Trip{ID: "tue", Route: "Market town", Seats: 8, Booked: 2},
		Trip{ID: "fri-late", Route: "Station", Seats: 4},
	)
	srv := httptest.NewServer(m.routes())
	defer srv.Close()

	routeGet := func(method, path, body string) (int, http.Header, []byte) {
		req, err := http.NewRequest(method, srv.URL+path, strings.NewReader(body))
		check.NoError(err, "building a request")
		resp, err := srv.Client().Do(req)
		if err != nil {
			t.Fatalf("request %s %s failed: %v", method, path, err)
		}
		defer resp.Body.Close()
		data, err := io.ReadAll(resp.Body)
		check.NoError(err, "reading a response body")
		return resp.StatusCode, resp.Header, data
	}

	code, header, body := routeGet("GET", "/trips/fri-late", "")
	check.Equal(code, 200, "GET of a second trip by its ID")
	check.Equal(header.Get("Content-Type"), "application/json", "Content-Type of a successful GET")
	var trip Trip
	check.NoError(json.Unmarshal(body, &trip), "the GET body is a JSON trip")
	check.Equal(trip, Trip{ID: "fri-late", Route: "Station", Seats: 4}, "the trip chosen by the {id} in the path")
	check.True(strings.Contains(string(body), `"booked":0`), "the JSON uses the field names from the Trip struct tags")

	code, header, body = routeGet("GET", "/trips/nope", "")
	check.Equal(code, 404, "GET of an unknown trip")
	check.Equal(header.Get("Content-Type"), "application/json", "Content-Type of a 404 error")
	var errBody map[string]string
	check.NoError(json.Unmarshal(body, &errBody), "a 404 body is a JSON object")
	check.True(errBody["error"] != "", "a 404 body has a non-empty \"error\" field")

	code, header, _ = routeGet("PUT", "/trips/tue", "")
	check.Equal(code, 405, "PUT on a trip is not allowed")
	check.True(strings.Contains(header.Get("Allow"), "GET"), "the 405 response comes from the mux, with an Allow header")
	code, _, _ = routeGet("GET", "/trips/tue/bookings", "")
	check.Equal(code, 405, "GET on the bookings path is not allowed")
	code, _, _ = routeGet("GET", "/trips", "")
	check.Equal(code, 404, "GET /trips has no handler")

	code, _, body = routeGet("POST", "/trips/fri-late/bookings", `{"passenger":"Sam","seats":4}`)
	check.Equal(code, 201, "booking every seat of a trip")
	trip = Trip{}
	check.NoError(json.Unmarshal(body, &trip), "the booking answer is a JSON trip")
	check.Equal(trip, Trip{ID: "fri-late", Route: "Station", Seats: 4, Booked: 4}, "the booking answer is the updated trip")
	_, _, body = routeGet("GET", "/trips/tue", "")
	trip = Trip{}
	check.NoError(json.Unmarshal(body, &trip), "the other trip is still JSON")
	check.Equal(trip.Booked, 2, "booking one trip leaves the other unchanged")
}
