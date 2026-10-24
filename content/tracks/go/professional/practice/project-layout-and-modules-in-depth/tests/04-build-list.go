// mvsGraph builds an edge map from (from, path, version) triples.
func mvsGraph(triples ...[3]string) map[string][]Requirement {
	edges := make(map[string][]Requirement)
	for _, tr := range triples {
		edges[tr[0]] = append(edges[tr[0]], Requirement{tr[1], tr[2]})
	}
	return edges
}

func Test(t *testing.T) {
	// The reference's example: C 1.3 is not selected, but its requirements still count.
	edges := mvsGraph(
		[3]string{"m", "a", "v1.2.0"},
		[3]string{"m", "b", "v1.2.0"},
		[3]string{"a@v1.2.0", "c", "v1.3.0"},
		[3]string{"b@v1.2.0", "c", "v1.4.0"},
		[3]string{"c@v1.3.0", "d", "v1.2.0"},
		[3]string{"c@v1.3.0", "e", "v1.1.0"},
		[3]string{"c@v1.4.0", "d", "v1.1.0"},
	)
	want := []Requirement{{"a", "v1.2.0"}, {"b", "v1.2.0"}, {"c", "v1.4.0"}, {"d", "v1.2.0"}, {"e", "v1.1.0"}}
	check.Equal(buildList("m", edges), want, "requirements of a version that is not selected still count")

	// Versions compared as numbers, and an upgrade found deep in the graph.
	edges = mvsGraph(
		[3]string{"m", "tz", "v1.9.0"},
		[3]string{"m", "clock", "v1.0.0"},
		[3]string{"clock@v1.0.0", "maps", "v0.2.0"},
		[3]string{"maps@v0.2.0", "tz", "v1.10.0"},
	)
	want = []Requirement{{"clock", "v1.0.0"}, {"maps", "v0.2.0"}, {"tz", "v1.10.0"}}
	check.Equal(buildList("m", edges), want, "a deeper requirement on a two-digit minor version wins")

	// A cycle back through the graph, and a requirement on the main module itself.
	edges = mvsGraph(
		[3]string{"m", "x", "v1.0.0"},
		[3]string{"x@v1.0.0", "y", "v1.0.0"},
		[3]string{"y@v1.0.0", "x", "v1.0.0"},
		[3]string{"y@v1.0.0", "m", "v0.1.0"},
	)
	want = []Requirement{{"x", "v1.0.0"}, {"y", "v1.0.0"}}
	check.Equal(buildList("m", edges), want, "a graph with a cycle, and the main module left out of the list")

	// Unreachable modules do not count, and the result is sorted by path.
	edges = mvsGraph(
		[3]string{"m", "zeta", "v1.0.0"},
		[3]string{"m", "alpha", "v1.0.0"},
		[3]string{"old@v1.0.0", "alpha", "v9.0.0"},
	)
	want = []Requirement{{"alpha", "v1.0.0"}, {"zeta", "v1.0.0"}}
	check.Equal(buildList("m", edges), want, "modules that nothing reachable requires are ignored; the list is sorted by path")

	check.Equal(len(buildList("m", map[string][]Requirement{})), 0, "a main module with no requirements has an empty build list")
}
