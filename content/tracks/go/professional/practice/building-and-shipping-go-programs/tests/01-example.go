import (
	"net/http"
	"net/http/httptest"
	"runtime/debug"
	"strings"
)

// gaugeInfo builds the BuildInfo that go build records for a binary.
func gaugeInfo(mainVersion string, settings ...string) *debug.BuildInfo {
	info := &debug.BuildInfo{GoVersion: "go1.27.3"}
	info.Main.Path = "example.org/tidegauge"
	info.Main.Version = mainVersion
	for i := 0; i+1 < len(settings); i += 2 {
		info.Settings = append(info.Settings, debug.BuildSetting{Key: settings[i], Value: settings[i+1]})
	}
	return info
}

func Test(t *testing.T) {
	info := gaugeInfo("v1.4.0",
		"GOOS", "linux",
		"vcs.revision", "916b28d272eff9abf881678fcd8c103652c5b44b",
		"vcs.modified", "false")
	check.Equal(versionLine(info), "tidegauge v1.4.0 (916b28d, go1.27.3)", "versionLine of a tagged, clean build")

	value, ok := defaultSetting("port")
	check.True(ok, `defaultSetting("port") finds the setting`)
	check.Equal(value, "8080", `defaultSetting("port")`)

	rec := httptest.NewRecorder()
	staticHandler().ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/", nil))
	check.Equal(rec.Code, http.StatusOK, `the status of GET / from staticHandler`)
	check.True(strings.Contains(rec.Body.String(), "<h1>Pier Head</h1>"), `GET / serves index.html`)
}
