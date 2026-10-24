package main

import (
	"cmp"
	"fmt"
	"slices"
	"strconv"
	"strings"
)

// Requirement is one module path at one version, such as example.com/geo at v1.4.0.
type Requirement struct {
	Path    string
	Version string
}

// parseVersion splits a version of the form vMAJOR.MINOR.PATCH into its three numbers.
// It reports false for anything else, including pre-release and build suffixes.
func parseVersion(v string) ([3]int, bool) {
	var nums [3]int
	rest, ok := strings.CutPrefix(v, "v")
	if !ok {
		return nums, false
	}
	parts := strings.Split(rest, ".")
	if len(parts) != 3 {
		return nums, false
	}
	for i, p := range parts {
		if p == "" || strings.Trim(p, "0123456789") != "" {
			return nums, false
		}
		n, err := strconv.Atoi(p)
		if err != nil {
			return nums, false
		}
		nums[i] = n
	}
	return nums, true
}

// compareVersions compares two valid versions numerically, part by part.
// It returns -1 if a is lower than b, 0 if they are equal and +1 if a is higher.
func compareVersions(a, b string) int {
	va, _ := parseVersion(a)
	vb, _ := parseVersion(b)
	for i := range va {
		if c := cmp.Compare(va[i], vb[i]); c != 0 {
			return c
		}
	}
	return 0
}

// parseNode splits "path@version" and checks the version.
func parseNode(field string) (Requirement, error) {
	path, version, ok := strings.Cut(field, "@")
	if !ok || path == "" {
		return Requirement{}, fmt.Errorf("%q has no @version", field)
	}
	if _, ok := parseVersion(version); !ok {
		return Requirement{}, fmt.Errorf("%q has an invalid version", field)
	}
	return Requirement{Path: path, Version: version}, nil
}

// isGoNode reports whether a field describes a Go version rather than a module.
func isGoNode(field string) bool {
	return strings.HasPrefix(field, "go@") || strings.HasPrefix(field, "toolchain@")
}

// parseGraph reads the output of go mod graph. It returns the main module's path and,
// for every module (the main path, or "path@version"), its requirements in input order.
func parseGraph(text string) (string, map[string][]Requirement, error) {
	main := ""
	edges := make(map[string][]Requirement)
	for i, line := range strings.Split(text, "\n") {
		fields := strings.Fields(line)
		if len(fields) == 0 {
			continue
		}
		if len(fields) != 2 {
			return "", nil, fmt.Errorf("line %d: want 2 fields, got %d", i+1, len(fields))
		}
		from, to := fields[0], fields[1]
		if isGoNode(from) || isGoNode(to) {
			continue
		}
		if main == "" {
			if strings.Contains(from, "@") {
				return "", nil, fmt.Errorf("line %d: first module %q has a version", i+1, from)
			}
			main = from
		}
		if from != main {
			if _, err := parseNode(from); err != nil {
				return "", nil, fmt.Errorf("line %d: %w", i+1, err)
			}
		}
		req, err := parseNode(to)
		if err != nil {
			return "", nil, fmt.Errorf("line %d: %w", i+1, err)
		}
		edges[from] = append(edges[from], req)
	}
	if main == "" {
		return "", nil, fmt.Errorf("no module requirements found")
	}
	return main, edges, nil
}

// buildList applies minimal version selection: it visits every module version reachable
// from main, keeps the highest version seen for each path, and returns them sorted by path.
func buildList(main string, edges map[string][]Requirement) []Requirement {
	selected := make(map[string]string)
	visited := map[string]bool{main: true}
	queue := []string{main}
	for len(queue) > 0 {
		node := queue[0]
		queue = queue[1:]
		for _, req := range edges[node] {
			if v, ok := selected[req.Path]; !ok || compareVersions(req.Version, v) > 0 {
				selected[req.Path] = req.Version
			}
			key := req.Path + "@" + req.Version
			if !visited[key] {
				visited[key] = true
				queue = append(queue, key)
			}
		}
	}
	delete(selected, main)

	list := make([]Requirement, 0, len(selected))
	for path, version := range selected {
		list = append(list, Requirement{Path: path, Version: version})
	}
	slices.SortFunc(list, func(a, b Requirement) int { return strings.Compare(a.Path, b.Path) })
	return list
}
