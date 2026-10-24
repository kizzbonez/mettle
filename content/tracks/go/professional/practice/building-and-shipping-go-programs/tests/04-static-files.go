import (
	"net/http"
	"net/http/httptest"
	"strings"
)

func gaugeGet(h http.Handler, path string) *httptest.ResponseRecorder {
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, path, nil))
	return rec
}

func Test(t *testing.T) {
	t.Chdir(t.TempDir()) // the files must come from the binary, not the disk
	h := staticHandler()

	page := gaugeGet(h, "/")
	check.Equal(page.Code, http.StatusOK, "the status of GET /")
	check.True(strings.HasPrefix(page.Body.String(), "<!doctype html>\n<title>Pier Head tide gauge</title>"),
		"GET / serves index.html, run from another folder")
	check.True(strings.HasPrefix(page.Header().Get("Content-Type"), "text/html"), "the content type of GET /")

	css := gaugeGet(h, "/station.css")
	check.Equal(css.Code, http.StatusOK, "the status of GET /station.css")
	check.True(strings.Contains(css.Body.String(), "#level { font-size: 3rem; }"), "GET /station.css serves the stylesheet")
	check.True(strings.HasPrefix(css.Header().Get("Content-Type"), "text/css"), "the content type of GET /station.css")

	check.Equal(gaugeGet(h, "/defaults.conf").Code, http.StatusNotFound,
		"GET /defaults.conf: the configuration is not embedded with the web files")
	check.Equal(gaugeGet(h, "/data/station.css").Code, http.StatusNotFound,
		"GET /data/station.css: the files are served from the root of the site, not under /data")
	check.Equal(gaugeGet(h, "/missing.js").Code, http.StatusNotFound, "GET of a file that does not exist")
}
