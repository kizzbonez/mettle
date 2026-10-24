import (
	"go/ast"
	"go/parser"
	"go/token"
	"strings"
)

// This test reads solution.go the way an analyzer does: it parses the source
// into a syntax tree and inspects the declarations and their comments.

// darkroomDocName returns the name a declaration's doc comment must start with.
func darkroomDocName(decl ast.Decl) (string, *ast.CommentGroup, bool) {
	switch d := decl.(type) {
	case *ast.FuncDecl:
		return d.Name.Name, d.Doc, d.Name.IsExported()
	case *ast.GenDecl:
		if d.Tok == token.TYPE && len(d.Specs) == 1 {
			spec := d.Specs[0].(*ast.TypeSpec)
			return spec.Name.Name, d.Doc, spec.Name.IsExported()
		}
	}
	return "", nil, false
}

func Test(t *testing.T) {
	fset := token.NewFileSet()
	file, err := parser.ParseFile(fset, "solution.go", nil, parser.ParseComments)
	check.NoError(err, "parsing solution.go")

	var taken *ast.FuncDecl
	for _, decl := range file.Decls {
		name, doc, exported := darkroomDocName(decl)
		if !exported {
			continue
		}
		check.True(doc != nil, "every exported function, method and type has a doc comment ("+name+")")
		check.True(strings.HasPrefix(doc.Text(), name+" "), "every doc comment starts with the name it documents ("+name+")")
		if fn, ok := decl.(*ast.FuncDecl); ok && fn.Recv != nil && name == "Taken" {
			taken = fn
		}
	}

	check.True(taken != nil, "the method Taken is still there, for old callers")
	check.True(strings.Contains(taken.Doc.Text(), "\nDeprecated: "), "Taken's doc comment has a paragraph starting with \"Deprecated: \"")
	directive := false
	for _, c := range taken.Doc.List {
		if c.Text == "//go:fix inline" {
			directive = true
		}
	}
	check.True(directive, "Taken's doc comment ends with the directive //go:fix inline")

	_, pointer := taken.Recv.List[0].Type.(*ast.StarExpr)
	check.True(pointer, "Taken has a pointer receiver, like the other methods")
	check.True(len(taken.Body.List) == 1, "Taken's body is a single statement, so go fix can inline it")
	ret, ok := taken.Body.List[0].(*ast.ReturnStmt)
	check.True(ok && len(ret.Results) == 1, "Taken's body is one return statement")
	call, ok := ret.Results[0].(*ast.CallExpr)
	check.True(ok, "Taken returns the result of a call")
	sel, ok := call.Fun.(*ast.SelectorExpr)
	check.True(ok && sel.Sel.Name == "IsBooked", "Taken returns the result of calling IsBooked")
}
