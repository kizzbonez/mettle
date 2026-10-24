import (
	"go/ast"
	"go/parser"
	"go/token"
	"strings"
)

// docProblem returns why the doc comment of an exported name is wrong, or "" when it is right.
func docProblem(name string, doc *ast.CommentGroup) string {
	if doc == nil {
		return "the exported name " + name + " has a doc comment directly above it"
	}
	if !strings.HasPrefix(doc.Text(), name+" ") {
		return "the doc comment of " + name + " is a sentence that starts with its name"
	}
	return ""
}

func Test(t *testing.T) {
	file, err := parser.ParseFile(token.NewFileSet(), "solution.go", nil, parser.ParseComments)
	check.NoError(err, "parsing solution.go")
	check.True(file.Doc != nil, "the package clause has a package doc comment directly above it")
	check.True(strings.HasPrefix(file.Doc.Text(), "Package deckchair "), "the package doc comment is a sentence that starts with the words Package deckchair")

	checked := 0
	for _, decl := range file.Decls {
		switch d := decl.(type) {
		case *ast.FuncDecl:
			if d.Name.IsExported() {
				checked++
				if problem := docProblem(d.Name.Name, d.Doc); problem != "" {
					check.Fail(problem)
				}
			}
		case *ast.GenDecl:
			for _, spec := range d.Specs {
				var name *ast.Ident
				var doc *ast.CommentGroup
				switch s := spec.(type) {
				case *ast.TypeSpec:
					name, doc = s.Name, s.Doc
				case *ast.ValueSpec:
					name, doc = s.Names[0], s.Doc
				}
				if name == nil || !name.IsExported() {
					continue
				}
				if doc == nil {
					doc = d.Doc
				}
				checked++
				if problem := docProblem(name.Name, doc); problem != "" {
					check.Fail(problem)
				}
			}
		}
	}
	check.True(checked >= 5, "every exported name of the API is declared in solution.go")
}
