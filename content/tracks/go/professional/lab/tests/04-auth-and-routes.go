import (
	"bytes"
	"encoding/json"
	"net/http"
	"strings"
)

func Test(t *testing.T) {
	cfg := mooringConfig()
	var logs bytes.Buffer
	store := newMemoryStore()
	h := newServer(cfg, store, mooringLogger(&logs))

	created := mooringCall(h, http.MethodPost, "/bookings", mooringBody(nil))
	check.Equal(created.Code, http.StatusCreated, "creating a booking to cancel")
	path := created.Header().Get("Location")

	for _, auth := range []string{
		"",
		mooringToken,
		"Bearer",
		"Bearer ",
		"bearer " + mooringToken,
		"Basic " + mooringToken,
		"Bearer " + mooringToken[:len(mooringToken)-1],
		"Bearer " + mooringToken + "x",
		"Bearer " + strings.ToUpper(mooringToken),
	} {
		rec := mooringCall(h, http.MethodDelete, path, "", "Authorization", auth)
		check.Equal(rec.Code, http.StatusUnauthorized, "DELETE without exactly \"Bearer <admin token>\" is refused")
		check.Equal(mooringError(rec), "unauthorized", "the error of an unauthorized DELETE")
	}
	still := mooringCall(h, http.MethodGet, path, "")
	check.Equal(still.Code, http.StatusOK, "a refused DELETE leaves the booking in place")

	missing := mooringCall(h, http.MethodDelete, "/bookings/b77", "", "Authorization", "Bearer "+mooringToken)
	check.Equal(missing.Code, http.StatusNotFound, "DELETE of a booking that does not exist, with the token")
	check.Equal(mooringError(missing), "booking not found", "the error of DELETE for a booking that does not exist")
	missingNoToken := mooringCall(h, http.MethodDelete, "/bookings/b77", "")
	check.Equal(missingNoToken.Code, http.StatusUnauthorized, "the token is checked before looking the booking up")

	done := mooringCall(h, http.MethodDelete, path, "", "Authorization", "Bearer "+mooringToken)
	check.Equal(done.Code, http.StatusNoContent, "DELETE with the admin token")
	check.Equal(done.Body.Len(), 0, "a 204 response has no body")
	check.Equal(mooringCall(h, http.MethodGet, path, "").Code, http.StatusNotFound, "GET after the booking was cancelled")
	check.Equal(mooringCall(h, http.MethodDelete, path, "", "Authorization", "Bearer "+mooringToken).Code,
		http.StatusNotFound, "a second DELETE of the same booking")

	// The token in the configuration is the one that counts.
	other := cfg
	other.AdminToken = "harbour-master-2027-token"
	h2 := newServer(other, store, mooringLogger(&logs))
	again := mooringCall(h2, http.MethodPost, "/bookings", mooringBody(map[string]any{"arrive": "2026-08-20"}))
	check.Equal(mooringCall(h2, http.MethodDelete, again.Header().Get("Location"), "", "Authorization", "Bearer "+mooringToken).Code,
		http.StatusUnauthorized, "DELETE with a token that is not the configured one")
	check.Equal(mooringCall(h2, http.MethodDelete, again.Header().Get("Location"), "", "Authorization", "Bearer harbour-master-2027-token").Code,
		http.StatusNoContent, "DELETE with the configured token")

	// Routes and the health check.
	t.Cleanup(func() { version = "dev" })
	version = "v2.1.0"
	health := mooringCall(h, http.MethodGet, "/healthz", "")
	var status map[string]string
	check.NoError(json.Unmarshal(health.Body.Bytes(), &status), "the body of GET /healthz is a JSON object")
	check.Equal(status, map[string]string{"status": "ok", "version": "v2.1.0"}, "GET /healthz reports the version variable")
	check.Equal(mooringCall(h, http.MethodPost, "/healthz", "").Code, http.StatusMethodNotAllowed, "POST /healthz is not allowed")
	check.Equal(mooringCall(h, http.MethodGet, "/bookings", "").Code, http.StatusMethodNotAllowed, "GET /bookings is not allowed")
	check.Equal(mooringCall(h, http.MethodGet, "/berths", "").Code, http.StatusNotFound, "a path the service does not have")

	stored := mooringCall(h, http.MethodPost, "/bookings", mooringBody(map[string]any{"arrive": "2026-09-09"}))
	var b Booking
	check.NoError(json.Unmarshal(stored.Body.Bytes(), &b), "the body of a new booking")
	got := mooringCall(h, http.MethodGet, "/bookings/"+b.ID, "")
	var fetched Booking
	check.NoError(json.Unmarshal(got.Body.Bytes(), &fetched), "the body of GET /bookings/{id}")
	check.Equal(fetched, b, "GET /bookings/{id} uses the id from the path")
}
