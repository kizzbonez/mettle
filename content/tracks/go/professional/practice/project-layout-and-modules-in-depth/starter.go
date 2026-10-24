package main

// Requirement is one module path at one version, such as example.com/geo at v1.4.0.
type Requirement struct {
	Path    string
	Version string
}

// compareVersions compares two valid versions numerically, part by part.
// It returns -1 if a is lower than b, 0 if they are equal and +1 if a is higher.
func compareVersions(a, b string) int {
	panic("not implemented")
}

// parseGraph reads the output of go mod graph. It returns the main module's path and,
// for every module (the main path, or "path@version"), its requirements in input order.
func parseGraph(text string) (string, map[string][]Requirement, error) {
	panic("not implemented")
}

// buildList applies minimal version selection: it visits every module version reachable
// from main, keeps the highest version seen for each path, and returns them sorted by path.
func buildList(main string, edges map[string][]Requirement) []Requirement {
	panic("not implemented")
}
