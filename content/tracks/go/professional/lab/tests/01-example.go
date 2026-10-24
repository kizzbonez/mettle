import (
	"bufio"
	"bytes"
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
)

// Helpers shared by the tests.

const mooringToken = "pier-head-7f3a9c2e" // the admin token in the tests

// mooringEnv returns a lookup function like os.LookupEnv over the given
// name, value pairs.
func mooringEnv(pairs ...string) func(string) (string, bool) {
	env := map[string]string{}
	for i := 0; i+1 < len(pairs); i += 2 {
		env[pairs[i]] = pairs[i+1]
	}
	return func(name string) (string, bool) {
		v, ok := env[name]
		return v, ok
	}
}

// mooringConfig is a valid configuration with the defaults.
func mooringConfig() Config {
	return Config{Addr: ":8080", Berths: 12, MaxBody: 4096, AdminToken: mooringToken}
}

// mooringLogger logs JSON lines to buf, without the time, so they can be checked.
func mooringLogger(buf *bytes.Buffer) *slog.Logger {
	return slog.New(slog.NewJSONHandler(buf, &slog.HandlerOptions{
		ReplaceAttr: func(groups []string, a slog.Attr) slog.Attr {
			if a.Key == slog.TimeKey && len(groups) == 0 {
				return slog.Attr{}
			}
			return a
		},
	}))
}

// mooringRecords parses the JSON log lines in buf.
func mooringRecords(buf *bytes.Buffer) []map[string]any {
	var records []map[string]any
	lines := bufio.NewScanner(bytes.NewReader(buf.Bytes()))
	for lines.Scan() {
		var record map[string]any
		if err := json.Unmarshal(lines.Bytes(), &record); err != nil {
			check.Fail("every log line is one JSON object", lines.Text())
		}
		records = append(records, record)
	}
	return records
}

// mooringCall sends one request to h. headers are name, value pairs.
func mooringCall(h http.Handler, method, path, body string, headers ...string) *httptest.ResponseRecorder {
	req := httptest.NewRequest(method, path, strings.NewReader(body))
	if body != "" {
		req.Header.Set("Content-Type", "application/json")
	}
	for i := 0; i+1 < len(headers); i += 2 {
		req.Header.Set(headers[i], headers[i+1])
	}
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	return rec
}

// mooringError decodes an {"error": "..."} body.
func mooringError(rec *httptest.ResponseRecorder) string {
	var body struct{ Error string }
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		return "(not a JSON error body: " + rec.Body.String() + ")"
	}
	return body.Error
}

// mooringBody builds a booking request body, with the given fields replaced.
func mooringBody(replace map[string]any) string {
	fields := map[string]any{"boat": "Kittiwake", "length_m": 7.2, "berth": 2, "arrive": "2026-08-10", "nights": 3}
	for k, v := range replace {
		if v == nil {
			delete(fields, k)
		} else {
			fields[k] = v
		}
	}
	data, _ := json.Marshal(fields)
	return string(data)
}

func Test(t *testing.T) {
	cfg, err := loadConfig([]string{"-berths", "8"}, mooringEnv("MOORINGS_ADMIN_TOKEN", mooringToken))
	check.NoError(err, `loadConfig(["-berths", "8"], with MOORINGS_ADMIN_TOKEN set)`)
	check.Equal(cfg, Config{Addr: ":8080", Berths: 8, MaxBody: 4096, AdminToken: mooringToken},
		`the Config from loadConfig(["-berths", "8"], with MOORINGS_ADMIN_TOKEN set)`)

	var logs bytes.Buffer
	srv := httptest.NewServer(newServer(cfg, newMemoryStore(), mooringLogger(&logs)))
	defer srv.Close()
	client := srv.Client()

	resp, err := client.Post(srv.URL+"/bookings", "application/json",
		strings.NewReader(`{"boat":"Sea Pie","length_m":9.5,"berth":3,"arrive":"2026-07-04","nights":2}`))
	check.NoError(err, "POST /bookings")
	body, _ := io.ReadAll(resp.Body)
	resp.Body.Close()
	check.Equal(resp.StatusCode, http.StatusCreated, "the status of POST /bookings")
	check.Equal(resp.Header.Get("Location"), "/bookings/b1", "the Location header of POST /bookings")
	check.True(strings.HasPrefix(resp.Header.Get("Content-Type"), "application/json"), "the Content-Type of POST /bookings")
	var created Booking
	check.NoError(json.Unmarshal(body, &created), "the body of POST /bookings is a JSON booking")
	check.Equal(created, Booking{ID: "b1", Boat: "Sea Pie", LengthM: 9.5, Berth: 3, Arrive: "2026-07-04", Nights: 2},
		"the booking returned by POST /bookings")

	resp, err = client.Get(srv.URL + "/bookings/b1")
	check.NoError(err, "GET /bookings/b1")
	var got Booking
	check.NoError(json.NewDecoder(resp.Body).Decode(&got), "the body of GET /bookings/b1 is a JSON booking")
	resp.Body.Close()
	check.Equal(resp.StatusCode, http.StatusOK, "the status of GET /bookings/b1")
	check.Equal(got, created, "the booking returned by GET /bookings/b1")

	req, _ := http.NewRequest(http.MethodDelete, srv.URL+"/bookings/b1", nil)
	req.Header.Set("Authorization", "Bearer "+mooringToken)
	resp, err = client.Do(req)
	check.NoError(err, "DELETE /bookings/b1 with the admin token")
	resp.Body.Close()
	check.Equal(resp.StatusCode, http.StatusNoContent, "the status of DELETE /bookings/b1 with the admin token")

	h := newServer(cfg, newMemoryStore(), mooringLogger(&logs))
	missing := mooringCall(h, http.MethodGet, "/bookings/b1", "")
	check.Equal(missing.Code, http.StatusNotFound, "the status of GET for a booking that does not exist")
	check.Equal(mooringError(missing), "booking not found", "the error of GET for a booking that does not exist")
	health := mooringCall(h, http.MethodGet, "/healthz", "")
	check.Equal(health.Code, http.StatusOK, "the status of GET /healthz")
	check.Equal(strings.TrimSpace(health.Body.String()), `{"status":"ok","version":"dev"}`, "the body of GET /healthz")

	records := mooringRecords(&logs)
	check.Equal(len(records), 5, "the number of log lines for five requests")
	check.Equal(records[0], map[string]any{"level": "INFO", "msg": "request", "method": "POST", "path": "/bookings", "status": 201.0},
		"the log line of POST /bookings")
}
