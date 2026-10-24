type testMember struct {
	Name    string  `form:"name,required"`
	Age     int     `form:"age"`
	Weight  float64 `form:"weight_kg"`
	Swimmer bool    `form:"swimmer,required"`
	Notes   string  // no tag: never filled
	Club    string  `form:"-"`
}

func Test(t *testing.T) {
	check.Equal(keys(testMember{}), []string{"name", "age", "weight_kg", "swimmer"}, "keys(testMember{})")

	m := testMember{Club: "River"}
	err := fill(&m, map[string]string{"name": " Ada ", "age": "34", "weight_kg": "61.5", "swimmer": "true", "Notes": "x"})
	check.NoError(err, "fill(&m, a complete sign-up form)")
	check.Equal(m, testMember{Name: "Ada", Age: 34, Weight: 61.5, Swimmer: true, Club: "River"}, "the member filled from a complete sign-up form")

	err = fill(&m, map[string]string{"name": "Bo", "age": "ten", "swimmer": "true"})
	check.ErrorIs(err, errBadValue, "fill with age \"ten\" returns errBadValue")
	check.Equal(err.Error(), `fill: bad value "ten" for "age"`, "the message for age \"ten\"")

	err = fill(&m, map[string]string{"name": "Bo"})
	check.ErrorIs(err, errMissing, "fill without the required swimmer key returns errMissing")
	check.Equal(err.Error(), `fill: missing required field "swimmer"`, "the message for a missing swimmer key")

	err = fill(m, map[string]string{})
	check.ErrorIs(err, errTarget, "fill(m, ...) with a struct instead of a pointer returns errTarget")
	check.Equal(err.Error(), "fill: want a non-nil pointer to a struct, got main.testMember", "the message for a struct passed without &")
}
