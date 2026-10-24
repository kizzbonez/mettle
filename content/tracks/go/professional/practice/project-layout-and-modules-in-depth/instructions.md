The depot's release checker reads the output of `go mod graph` and works out, with minimal
version selection, which version of each module the next build will use. Complete the three
functions in `solution.go`. Keep the `Requirement` type and the three signatures exactly as
given; add any helper functions you like.

A **valid version** has the form `vMAJOR.MINOR.PATCH`: a `v`, then three parts separated by dots,
each one or more digits (`v1.4.0`, `v0.10.12`). Anything else is invalid, including `1.4.0`,
`v1.4`, `v1.x.0` and pre-release versions such as `v1.4.0-rc.1`.

1. **`compareVersions(a, b string) int`** compares two valid versions and returns `-1` if `a` is
   lower, `0` if they are equal and `+1` if `a` is higher. Compare MAJOR, then MINOR, then PATCH,
   **as numbers**: `v1.10.0` is higher than `v1.9.0`.
2. **`parseGraph(text string) (string, map[string][]Requirement, error)`** reads `go mod graph`
   output. Lines are separated by `"\n"`; a line that is empty or only spaces is skipped. Every
   other line must have exactly two fields separated by spaces (`strings.Fields`): a module and
   one of its requirements.
   - Skip a line in which either field starts with `go@` or `toolchain@`: those record Go
     versions, not modules.
   - The first field of the first remaining line is the **main module**: a path with no `@`.
     Return that path as the first result.
   - Every other first field, and every second field, must be `path@version` with a non-empty
     path and a valid version.
   - In the map, the key is the first field exactly as written (the main path, or
     `path@version`), and the value lists its requirements in the order of the lines.
   - On any bad line, return an error whose message starts with `line N:`, where N counts every
     line from 1, blank ones included. If no module line remains at all, return an error too.
3. **`buildList(main string, edges map[string][]Requirement) []Requirement`** applies minimal
   version selection. Start from `main` and visit **every** module version that can be reached
   through the edges, even versions that end up not selected, and visit each one only once (a
   graph can have cycles). For each module path, keep the highest version required anywhere on
   the way. Return one `Requirement` per path, not including the main module, sorted by path. A
   module version with no entry in the map simply has no requirements.

```go
graph := `example.com/tramapp example.com/fares@v1.2.0
example.com/tramapp example.com/stops@v1.2.0
example.com/tramapp go@1.27
example.com/fares@v1.2.0 example.com/geo@v1.3.0
example.com/stops@v1.2.0 example.com/geo@v1.4.0
go@1.27 toolchain@go1.27`

main, edges, err := parseGraph(graph)
// main == "example.com/tramapp", err == nil
// edges["example.com/fares@v1.2.0"] == []Requirement{{"example.com/geo", "v1.3.0"}}

buildList(main, edges)
// []Requirement{
// 	{"example.com/fares", "v1.2.0"},
// 	{"example.com/geo", "v1.4.0"},
// 	{"example.com/stops", "v1.2.0"},
// }

compareVersions("v1.10.0", "v1.9.0") // 1
_, _, err = parseGraph("example.com/app example.com/geo@v1.4")
// err.Error() starts with "line 1:"
```
