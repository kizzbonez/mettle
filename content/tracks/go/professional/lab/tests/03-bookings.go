import (
	"bytes"
	"encoding/json"
	"net/http"
	"strings"
)

func Test(t *testing.T) {
	cfg := mooringConfig()
	cfg.Berths = 5
	cfg.MaxBody = 512
	var logs bytes.Buffer
	h := newServer(cfg, newMemoryStore(), mooringLogger(&logs))

	ok := mooringCall(h, http.MethodPost, "/bookings", mooringBody(map[string]any{"boat": "  Kittiwake  "}))
	check.Equal(ok.Code, http.StatusCreated, "the status of a valid booking")
	var b Booking
	check.NoError(json.Unmarshal(ok.Body.Bytes(), &b), "the body of a valid booking is JSON")
	check.Equal(b.Boat, "Kittiwake", "the boat name is stored without the spaces around it")
	check.Equal(ok.Header().Get("Location"), "/bookings/"+b.ID, "the Location header names the new booking")

	// Validation, in the order of the instructions.
	for _, c := range []struct {
		replace map[string]any
		want    string
		about   string
	}{
		{map[string]any{"boat": nil}, "boat is required", "no boat field"},
		{map[string]any{"boat": "   "}, "boat is required", "a boat name of spaces only"},
		{map[string]any{"boat": strings.Repeat("é", 41)}, "boat must be at most 40 characters", "a boat name of 41 characters"},
		{map[string]any{"length_m": 0}, "length_m must be more than 0 and at most 20", "length_m 0"},
		{map[string]any{"length_m": -3}, "length_m must be more than 0 and at most 20", "length_m -3"},
		{map[string]any{"length_m": 20.01}, "length_m must be more than 0 and at most 20", "length_m 20.01"},
		{map[string]any{"berth": 0}, "berth must be between 1 and 5", "berth 0, with 5 berths configured"},
		{map[string]any{"berth": 6}, "berth must be between 1 and 5", "berth 6, with 5 berths configured"},
		{map[string]any{"arrive": "10/08/2026"}, "arrive must be a date like 2026-07-04", "arrive 10/08/2026"},
		{map[string]any{"arrive": "2026-02-30"}, "arrive must be a date like 2026-07-04", "arrive 2026-02-30"},
		{map[string]any{"arrive": nil}, "arrive must be a date like 2026-07-04", "no arrive field"},
		{map[string]any{"nights": 0}, "nights must be between 1 and 14", "nights 0"},
		{map[string]any{"nights": 15}, "nights must be between 1 and 14", "nights 15"},
		{map[string]any{"boat": "", "nights": 0}, "boat is required", "an empty boat and nights 0 together"},
		{map[string]any{"berth": 9, "length_m": 25}, "length_m must be more than 0 and at most 20", "berth 9 and length_m 25 together"},
	} {
		rec := mooringCall(h, http.MethodPost, "/bookings", mooringBody(c.replace))
		check.Equal(rec.Code, http.StatusUnprocessableEntity, "the status of a booking with "+c.about)
		check.Equal(mooringError(rec), c.want, "the error of a booking with "+c.about+" (the first rule broken, in order)")
		check.True(strings.HasPrefix(rec.Header().Get("Content-Type"), "application/json"), "errors are sent as JSON")
	}
	for _, edge := range []struct {
		replace map[string]any
		about   string
	}{
		{map[string]any{"boat": strings.Repeat("é", 40), "berth": 1, "arrive": "2026-09-01"}, "a boat name of 40 characters (80 bytes)"},
		{map[string]any{"length_m": 20, "berth": 5, "nights": 14, "arrive": "2026-10-01"}, "length_m 20, the last berth and 14 nights"},
		{map[string]any{"length_m": 0.5, "nights": 1, "arrive": "2026-11-01"}, "length_m 0.5 and 1 night"},
	} {
		rec := mooringCall(h, http.MethodPost, "/bookings", mooringBody(edge.replace))
		check.Equal(rec.Code, http.StatusCreated, "a booking at the limits of the rules is accepted: "+edge.about)
	}

	// Bodies that are not one JSON object with the booking fields.
	for _, c := range []struct{ body, about string }{
		{``, "an empty body"},
		{`{"boat":`, "a body cut off halfway"},
		{`["Kittiwake"]`, "a JSON array"},
		{`{"boat":"Kittiwake","length_m":"long","berth":2,"arrive":"2026-08-10","nights":3}`, "a string where a number belongs"},
		{mooringBody(map[string]any{"id": "b99"}), "an id sent by the client"},
		{mooringBody(map[string]any{"crew": 4}), "an unknown field"},
		{mooringBody(nil) + `{"boat":"Second"}`, "a second JSON object after the first"},
		{mooringBody(nil) + ` and more`, "text after the JSON object"},
	} {
		rec := mooringCall(h, http.MethodPost, "/bookings", c.body)
		check.Equal(rec.Code, http.StatusBadRequest, "the status of a body with "+c.about)
		check.Equal(mooringError(rec), "invalid JSON body", "the error of a body with "+c.about)
	}

	big := mooringBody(map[string]any{"boat": strings.Repeat("x", 600)})
	rec := mooringCall(h, http.MethodPost, "/bookings", big)
	check.Equal(rec.Code, http.StatusRequestEntityTooLarge, "the status of a body over MaxBody")
	check.Equal(mooringError(rec), "request body too large", "the error of a body over MaxBody")
	fits := mooringBody(map[string]any{"boat": "Fits", "arrive": "2026-12-01", "nights": 1})
	fits += strings.Repeat(" ", 512-len(fits))
	check.Equal(mooringCall(h, http.MethodPost, "/bookings", fits).Code, http.StatusCreated,
		"a body of exactly MaxBody bytes is accepted")

	// A berth that is taken on one of the nights.
	first := mooringCall(h, http.MethodPost, "/bookings", mooringBody(map[string]any{"berth": 4, "arrive": "2027-01-10", "nights": 3}))
	check.Equal(first.Code, http.StatusCreated, "booking berth 4 from 10 January for 3 nights")
	clash := mooringCall(h, http.MethodPost, "/bookings", mooringBody(map[string]any{"berth": 4, "arrive": "2027-01-12", "nights": 2}))
	check.Equal(clash.Code, http.StatusConflict, "the status of a booking that overlaps another on the same berth")
	check.Equal(mooringError(clash), "berth is taken for those nights", "the error of an overlapping booking")
	next := mooringCall(h, http.MethodPost, "/bookings", mooringBody(map[string]any{"berth": 4, "arrive": "2027-01-13", "nights": 2}))
	check.Equal(next.Code, http.StatusCreated, "a booking that starts the day the last one leaves")

	check.Equal(mooringCall(h, http.MethodPut, "/bookings", mooringBody(nil)).Code, http.StatusMethodNotAllowed,
		"PUT /bookings is not allowed")
	check.Equal(mooringCall(h, http.MethodGet, "/bookings/b404", "").Code, http.StatusNotFound,
		"GET of a booking that does not exist")
}
