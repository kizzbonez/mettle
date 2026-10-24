import "strings"

const exampleGraph = `example.com/tramapp example.com/fares@v1.2.0
example.com/tramapp example.com/stops@v1.2.0
example.com/tramapp go@1.27
example.com/fares@v1.2.0 example.com/geo@v1.3.0
example.com/stops@v1.2.0 example.com/geo@v1.4.0
go@1.27 toolchain@go1.27`

func Test(t *testing.T) {
	main, edges, err := parseGraph(exampleGraph)
	check.NoError(err, "parseGraph of the example graph")
	check.Equal(main, "example.com/tramapp", "the main module of the example graph")
	check.Equal(edges["example.com/fares@v1.2.0"], []Requirement{{"example.com/geo", "v1.3.0"}}, "the requirements of fares v1.2.0")
	check.Equal(edges["example.com/tramapp"], []Requirement{{"example.com/fares", "v1.2.0"}, {"example.com/stops", "v1.2.0"}}, "the main module's requirements, without the go line")

	want := []Requirement{
		{"example.com/fares", "v1.2.0"},
		{"example.com/geo", "v1.4.0"},
		{"example.com/stops", "v1.2.0"},
	}
	check.Equal(buildList(main, edges), want, "the build list of the example graph")

	check.Equal(compareVersions("v1.10.0", "v1.9.0"), 1, "compareVersions(v1.10.0, v1.9.0)")

	_, _, err = parseGraph("example.com/app example.com/geo@v1.4")
	check.Error(err, "a requirement with a two-part version is rejected")
	if err != nil {
		check.True(strings.HasPrefix(err.Error(), "line 1:"), "the error for a bad first line starts with \"line 1:\"; got "+err.Error())
	}
}
