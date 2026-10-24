import (
	"go/ast"
	"go/parser"
	"go/token"
	"reflect"
	"slices"
)

// exportedTopLevel lists the exported package-level names that file declares, in order.
func exportedTopLevel(file *ast.File) []string {
	var names []string
	for _, decl := range file.Decls {
		switch d := decl.(type) {
		case *ast.FuncDecl:
			if d.Recv == nil && d.Name.IsExported() {
				names = append(names, d.Name.Name)
			}
		case *ast.GenDecl:
			for _, spec := range d.Specs {
				switch s := spec.(type) {
				case *ast.TypeSpec:
					if s.Name.IsExported() {
						names = append(names, s.Name.Name)
					}
				case *ast.ValueSpec:
					for _, n := range s.Names {
						if n.IsExported() {
							names = append(names, n.Name)
						}
					}
				}
			}
		}
	}
	return names
}

func Test(t *testing.T) {
	file, err := parser.ParseFile(token.NewFileSet(), "solution.go", nil, 0)
	check.NoError(err, "parsing solution.go")
	names := exportedTopLevel(file)
	slices.Sort(names)
	check.Equal(names, []string{"DayCapHours", "Price", "Sell", "Shift", "Takings"}, "the exported package-level names: exactly the API in the instructions")

	shift := reflect.TypeFor[Shift]()
	var exported []string
	takings := false
	for field := range shift.Fields() {
		if field.IsExported() {
			exported = append(exported, field.Name)
		}
		if field.Name == "takings" && field.Type.Kind() == reflect.Int {
			takings = true
		}
	}
	check.Equal(exported, []string{"Attendant"}, "Shift's exported fields")
	check.True(takings, "Shift keeps its takings in an unexported int field named takings")
	check.Equal(billable(9), DayCapHours, "the unexported helper billable still works")
}
