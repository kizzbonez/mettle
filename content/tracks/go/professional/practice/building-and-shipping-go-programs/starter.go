package main

import (
	"net/http"
	"runtime/debug"
)

// version is set at build time with -ldflags "-X main.version=v1.4.0".
var version = "dev"

// Task 2: build data/defaults.conf into the binary with a //go:embed line
// (and import "embed").
var defaultConfig string

// Task 3: embed data/*.html and data/*.css here, as an embed.FS.

// Task 1: versionLine describes the running binary, for example
// "tidegauge v1.4.0 (916b28d, go1.27.3)".
func versionLine(info *debug.BuildInfo) string {
	panic("not implemented")
}

// Task 2: defaultSetting returns the value of key in the embedded defaults.
func defaultSetting(key string) (string, bool) {
	panic("not implemented")
}

// Task 3: staticHandler serves the embedded web files from the root of the site.
func staticHandler() http.Handler {
	panic("not implemented")
}
