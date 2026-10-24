Complete `solution.go`. The lab's `data/` folder holds `defaults.conf`, `index.html` and
`station.css`, the files that used to be copied next to the program. The tests run your code
from an empty folder, so they find these files only if they are built into the binary.

1. **`versionLine(info *debug.BuildInfo) string`** describes the binary in this form:

   ```text
   tidegauge <version> (<commit>, <go version>)
   ```

   - `<version>` is the package variable `version` when a release build set it with
     `-ldflags "-X main.version=..."`, that is when it is not `"dev"`. Otherwise it is
     `info.Main.Version`, unless that is empty or `"(devel)"`; then it is `dev`.
   - `<commit>` is the first 7 characters of the `vcs.revision` setting, followed by `-dirty`
     when the `vcs.modified` setting is `"true"`. With no `vcs.revision` it is `unknown commit`.
   - `<go version>` is `info.GoVersion`.
   - `info` is nil when `debug.ReadBuildInfo` found nothing: the line is then
     `tidegauge <version> (unknown commit, unknown Go)`.
2. **`defaultSetting(key string) (string, bool)`** looks `key` up in `data/defaults.conf`.
   Embed the file in the string `defaultConfig` with a `//go:embed` line (import `embed`, with
   `_` if you use nothing else from it). Each setting is a line `key = value`: the key is
   everything before the first `=` and the value everything after it, both without the spaces
   around them. Skip empty lines and lines starting with `#`. Keys match exactly; a missing key
   gives `"", false`.
3. **`staticHandler() http.Handler`** serves the web files from the root of the site, so that
   `GET /` returns `index.html` and `GET /station.css` the stylesheet. Embed **only**
   `data/*.html` and `data/*.css` in an `embed.FS`: the configuration file must not be
   downloadable. Use `fs.Sub` to make `data` the root, and `http.FileServerFS` to serve it.

```go
info := &debug.BuildInfo{GoVersion: "go1.27.3"}
info.Main.Version = "v1.4.0"
info.Settings = []debug.BuildSetting{
	{Key: "vcs.revision", Value: "916b28d272eff9abf881678fcd8c103652c5b44b"},
	{Key: "vcs.modified", Value: "false"},
}
versionLine(info) // "tidegauge v1.4.0 (916b28d, go1.27.3)"
versionLine(nil)  // "tidegauge dev (unknown commit, unknown Go)"

defaultSetting("port")     // "8080", true
defaultSetting("password") // "", false

// GET /              -> 200, index.html
// GET /station.css   -> 200, the stylesheet
// GET /defaults.conf -> 404
```

On your own machine, `go build -trimpath -ldflags="-s -w -X main.version=v1.4.0" .` and a
call of `versionLine` with the result of `debug.ReadBuildInfo()` show the real thing.
