package main

import (
	"embed"
	"io/fs"
	"net/http"
	"runtime/debug"
	"strings"
)

// version is set at build time with -ldflags "-X main.version=v1.4.0".
var version = "dev"

// defaultConfig is data/defaults.conf, built into the binary.
//
//go:embed data/defaults.conf
var defaultConfig string

// staticFiles holds the web page and its stylesheet, and nothing else.
//
//go:embed data/*.html data/*.css
var staticFiles embed.FS

// versionLine describes the running binary, for example
// "tidegauge v1.4.0 (916b28d, go1.27.3)". info is what debug.ReadBuildInfo
// returned, or nil when there was none.
func versionLine(info *debug.BuildInfo) string {
	v, commit, goVersion := version, "unknown commit", "unknown Go"
	if info != nil {
		if v == "dev" && info.Main.Version != "" && info.Main.Version != "(devel)" {
			v = info.Main.Version
		}
		goVersion = info.GoVersion
		commit = shortCommit(info.Settings)
	}
	return "tidegauge " + v + " (" + commit + ", " + goVersion + ")"
}

// shortCommit returns the first seven characters of the VCS revision, with
// "-dirty" when the tree had changes, or "unknown commit".
func shortCommit(settings []debug.BuildSetting) string {
	revision, modified := "", false
	for _, s := range settings {
		switch s.Key {
		case "vcs.revision":
			revision = s.Value
		case "vcs.modified":
			modified = s.Value == "true"
		}
	}
	if revision == "" {
		return "unknown commit"
	}
	revision = revision[:min(len(revision), 7)]
	if modified {
		revision += "-dirty"
	}
	return revision
}

// defaultSetting returns the value of key in the embedded defaults.
func defaultSetting(key string) (string, bool) {
	for line := range strings.Lines(defaultConfig) {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		k, v, found := strings.Cut(line, "=")
		if found && strings.TrimSpace(k) == key {
			return strings.TrimSpace(v), true
		}
	}
	return "", false
}

// staticHandler serves the embedded web files from the root of the site:
// "/" is index.html and "/station.css" the stylesheet.
func staticHandler() http.Handler {
	site, err := fs.Sub(staticFiles, "data")
	if err != nil {
		panic(err) // "data" is a valid path, so this cannot happen
	}
	return http.FileServerFS(site)
}
