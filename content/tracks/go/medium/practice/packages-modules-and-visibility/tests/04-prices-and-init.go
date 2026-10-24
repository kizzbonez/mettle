import (
	"go/ast"
	"go/parser"
	"go/token"
)

func Test(t *testing.T) {
	file, err := parser.ParseFile(token.NewFileSet(), "solution.go", nil, 0)
	check.NoError(err, "parsing solution.go")
	initialised := false
	for _, decl := range file.Decls {
		switch d := decl.(type) {
		case *ast.FuncDecl:
			check.True(d.Name.Name != "init", "the package has no init function")
		case *ast.GenDecl:
			for _, spec := range d.Specs {
				if s, ok := spec.(*ast.ValueSpec); ok && s.Names[0].Name == "rates" && len(s.Values) == 1 {
					initialised = true
				}
			}
		}
	}
	check.True(initialised, "rates gets its value in its own var declaration")

	cases := []struct {
		kind  string
		hours int
		price int
		ok    bool
	}{
		{"deckchair", 1, 250, true},
		{"windbreak", 4, 600, true},
		{"sunlounger", 5, 2000, true},
		{"deckchair", 6, 1250, true},
		{"windbreak", 12, 750, true},
		{"deckchair", -2, 0, false},
		{"Deckchair", 2, 0, false},
		{"", 1, 0, false},
	}
	for _, c := range cases {
		price, ok := Price(c.kind, c.hours)
		check.Equal(ok, c.ok, "whether Price accepts a hire, for kinds and hours of every sort")
		check.Equal(price, c.price, "the price of a hire, for kinds and hours of every sort")
	}

	ana, ben := &Shift{Attendant: "Ana"}, &Shift{Attendant: "Ben"}
	Sell(ana, "sunlounger", 2)
	Sell(ben, "deckchair", 1)
	Sell(ana, "deckchair", 8)
	Sell(ana, "windbreak", 0)
	check.Equal(Takings(*ana), 2050, "the takings of a shift after several sales, one of them refused")
	check.Equal(Takings(*ben), 250, "a second shift keeps its own takings")
	check.Equal(Takings(Shift{Attendant: "Cy"}), 0, "a new shift has taken nothing")
}
