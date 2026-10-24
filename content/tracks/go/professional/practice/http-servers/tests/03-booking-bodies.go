import (
	"encoding/json"
	"net/http/httptest"
	"strings"
)

// bodyPost sends a booking for trip id and returns the recorder.
func bodyPost(m *minibus, id, body string) *httptest.ResponseRecorder {
	rec := httptest.NewRecorder()
	m.routes().ServeHTTP(rec, httptest.NewRequest("POST", "/trips/"+id+"/bookings", strings.NewReader(body)))
	return rec
}

// bodyBooked reads how many seats trip id has booked, through the API.
func bodyBooked(m *minibus, id string) int {
	rec := httptest.NewRecorder()
	m.routes().ServeHTTP(rec, httptest.NewRequest("GET", "/trips/"+id, nil))
	var trip Trip
	if err := json.Unmarshal(rec.Body.Bytes(), &trip); err != nil {
		return -1
	}
	return trip.Booked
}

func Test(t *testing.T) {
	m := newMinibus(Trip{ID: "thu", Route: "Market town", Seats: 10})

	cases := []struct {
		body string
		code int
		what string
	}{
		{`{"passenger":"` + strings.Repeat("A", 1100) + `","seats":1}`, 413, "a body over 1,024 bytes"},
		{`{"passenger":"Ines","seats":1,"wheelchair":true}`, 400, "a body with an unknown field"},
		{`{"passenger":"Ines","seats":`, 400, "a body that is cut off"},
		{`not json`, 400, "a body that is not JSON"},
		{`{"passenger":"Ines","seats":"two"}`, 400, "seats sent as a string"},
		{`{"passenger":"","seats":1}`, 422, "an empty passenger"},
		{`{"passenger":"   ","seats":1}`, 422, "a passenger of only spaces"},
		{`{"seats":1}`, 422, "a missing passenger"},
		{`{"passenger":"Ines","seats":0}`, 422, "zero seats"},
		{`{"passenger":"Ines","seats":-2}`, 422, "a negative number of seats"},
	}
	for _, c := range cases {
		rec := bodyPost(m, "thu", c.body)
		check.Equal(rec.Code, c.code, "status for "+c.what)
		check.Equal(rec.Result().Header.Get("Content-Type"), "application/json", "Content-Type of the error for "+c.what)
		var errBody map[string]string
		check.NoError(json.Unmarshal(rec.Body.Bytes(), &errBody), "the answer to "+c.what+" is a JSON object")
		check.True(errBody["error"] != "", "the answer to "+c.what+" has a non-empty \"error\" field")
	}
	check.Equal(bodyBooked(m, "thu"), 0, "rejected bookings book no seats")

	rec := bodyPost(m, "sun", `{"passenger":"Ines","seats":1}`)
	check.Equal(rec.Code, 404, "a valid booking for a trip that does not exist")
	rec = bodyPost(m, "sun", `{"passenger":"Ines","seats":`)
	check.Equal(rec.Code, 404, "an unknown trip is reported before a bad body")

	rec = bodyPost(m, "thu", `{"passenger":"`+strings.Repeat("B", 900)+`","seats":2}`)
	check.Equal(rec.Code, 201, "a body just under the limit is accepted")
	check.Equal(bodyBooked(m, "thu"), 2, "seats booked by the accepted body")
}
