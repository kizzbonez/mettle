import "strings"

// errorLine checks that err is an error whose message starts with "line N:".
func errorLine(err error, prefix, what string) {
	if err == nil {
		check.Fail(what + ": no error was returned")
		return
	}
	check.True(strings.HasPrefix(err.Error(), prefix), what+": the error should start with the right line number; got "+err.Error())
}

func Test(t *testing.T) {
	graph := "\n  \nexample.com/kiosk example.com/fares@v1.1.0\nexample.com/kiosk go@1.27\n\nexample.com/fares@v1.1.0 example.com/geo@v0.3.2\n  example.com/fares@v1.1.0   example.com/units@v1.0.0  \ngo@1.27 toolchain@go1.27\n"
	main, edges, err := parseGraph(graph)
	check.NoError(err, "a graph with blank lines, extra spaces and go lines")
	check.Equal(main, "example.com/kiosk", "the main module is the first field of the first module line")
	check.Equal(edges["example.com/kiosk"], []Requirement{{"example.com/fares", "v1.1.0"}}, "the main module's requirements")
	check.Equal(edges["example.com/fares@v1.1.0"], []Requirement{{"example.com/geo", "v0.3.2"}, {"example.com/units", "v1.0.0"}}, "a module's requirements in line order")
	check.Equal(len(edges), 2, "only modules with requirements have map entries; go and toolchain lines add none")
	_, hasGo := edges["go@1.27"]
	check.True(!hasGo, "go@ lines are skipped, not stored")

	_, _, err = parseGraph("example.com/a example.com/b@v1.0.0\nexample.com/a example.com/c@v1.0.0 extra")
	errorLine(err, "line 2:", "a line with three fields")
	_, _, err = parseGraph("example.com/a example.com/b@v1.0.0\n\nexample.com/b@v1.0.0")
	errorLine(err, "line 3:", "a line with one field after a blank line")
	_, _, err = parseGraph("example.com/a example.com/b")
	errorLine(err, "line 1:", "a requirement without @version")
	_, _, err = parseGraph("example.com/a example.com/b@1.0.0")
	errorLine(err, "line 1:", "a version without the v")
	_, _, err = parseGraph("example.com/a example.com/b@v1.x.0")
	errorLine(err, "line 1:", "a version with a letter in it")
	_, _, err = parseGraph("example.com/a example.com/b@v1.0.0-rc.1")
	errorLine(err, "line 1:", "a pre-release version")
	_, _, err = parseGraph("example.com/a example.com/b@v1.0.0\nexample.com/b example.com/c@v1.0.0")
	errorLine(err, "line 2:", "a second module without @version")
	_, _, err = parseGraph("example.com/a example.com/b@v1.0.0\nexample.com/b@v1..0 example.com/c@v1.0.0")
	errorLine(err, "line 2:", "a module field with an empty version part")
	_, _, err = parseGraph("example.com/a example.com/b@v1.0.0\n@v1.0.0 example.com/c@v1.0.0")
	errorLine(err, "line 2:", "a module field with an empty path")
	_, _, err = parseGraph("\n\ngo@1.27 toolchain@go1.27\n")
	check.Error(err, "a graph with no module lines at all")
}
