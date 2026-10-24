type testSafety struct {
	Instructor string   `form:"instructor"`
	Checks     []string `form:"checks"`
	Count      uint     `form:"count"`
	inspector  string   `form:"inspector"`
	Signed     bool     `form:"signed,required"`
	Skipped    string   `form:"-"`
}

func Test(t *testing.T) {
	check.Equal(keys(testSafety{}), []string{"instructor", "checks", "count", "signed"}, "keys of a struct with unexported and \"-\" fields")
	check.Equal(keys(&testSafety{}), []string{"instructor", "checks", "count", "signed"}, "keys of a pointer to a struct")
	check.Equal(keys((*testSafety)(nil)), []string{"instructor", "checks", "count", "signed"}, "keys of a nil pointer to a struct")
	check.True(keys(42) == nil, "keys of an int is nil")
	check.True(keys(nil) == nil, "keys of nil is nil")
	check.True(keys([]testSafety{}) == nil, "keys of a slice is nil")
	check.Equal(len(keys(struct{ A, B int }{})), 0, "keys of a struct without form tags is empty")

	s := testSafety{Instructor: "Flo"}
	err := fill(&s, map[string]string{"signed": "true", "checks": "helmet,vest"})
	check.ErrorIs(err, errUnsupported, "a slice field that the form gives a value for returns errUnsupported")
	check.Equal(err.Error(), `fill: unsupported field kind slice for "checks"`, "the message for a slice field")
	err = fill(&s, map[string]string{"signed": "true", "count": "4"})
	check.ErrorIs(err, errUnsupported, "a uint field that the form gives a value for returns errUnsupported")
	check.Equal(err.Error(), `fill: unsupported field kind uint for "count"`, "the message for a uint field")
	check.NoError(fill(&s, map[string]string{"signed": "true"}), "unsupported fields that the form gives no value for are no problem")

	n := 3
	var nilSafety *testSafety
	targets := []struct {
		dst  any
		name string
		what string
	}{
		{s, "main.testSafety", "a struct value"},
		{nilSafety, "*main.testSafety", "a nil pointer to a struct"},
		{&n, "*int", "a pointer to an int"},
		{nil, "<nil>", "nil"},
		{map[string]string{}, "map[string]string", "a map"},
	}
	for _, c := range targets {
		err := fill(c.dst, map[string]string{"signed": "true"})
		check.ErrorIs(err, errTarget, "fill into "+c.what+" returns errTarget")
		check.Equal(err.Error(), "fill: want a non-nil pointer to a struct, got "+c.name, "the message for "+c.what)
	}
	check.Equal(n, 3, "fill does not change an int it was given a pointer to")
}
