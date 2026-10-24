import (
	"go/ast"
	"go/parser"
	"go/token"
	"reflect"
	"slices"
)

func Test(t *testing.T) {
	var methods []string
	for m := range reflect.TypeFor[Item]().Methods() {
		methods = append(methods, m.Name)
	}
	check.Equal(methods, []string{"Label", "Price"}, "the methods of the Item interface")

	file, err := parser.ParseFile(token.NewFileSet(), "solution.go", nil, 0)
	check.NoError(err, "parsing solution.go")
	var embedded []string
	found := false
	ast.Inspect(file, func(n ast.Node) bool {
		spec, ok := n.(*ast.TypeSpec)
		if !ok || spec.Name.Name != "Item" {
			return true
		}
		found = true
		if iface, ok := spec.Type.(*ast.InterfaceType); ok {
			for _, field := range iface.Methods.List {
				if ident, ok := field.Type.(*ast.Ident); ok && len(field.Names) == 0 {
					embedded = append(embedded, ident.Name)
				}
			}
		}
		return false
	})
	check.True(found, "solution.go declares the type Item")
	slices.Sort(embedded)
	check.Equal(embedded, []string{"Labeller", "Pricer"}, "the interfaces that Item embeds")

	item := reflect.TypeFor[Item]()
	check.True(reflect.TypeFor[Print]().Implements(item), "a Print is an Item")
	check.True(reflect.TypeFor[Framed]().Implements(item), "a Framed is an Item")
	check.True(reflect.TypeFor[Sale]().Implements(item), "a Sale is an Item")
}
