import "strconv"

func Test(t *testing.T) {
	r, err := parseReading("08:00 412")
	check.NoError(err, "parseReading of a valid line returns no error")
	check.Equal(r, Reading{Hour: "08:00", Count: 412}, "parseReading of a valid line")
	r, err = parseReading("  23:00\t\t0  ")
	check.NoError(err, "parseReading accepts tabs, extra spaces and a count of 0")
	check.Equal(r, Reading{Hour: "23:00", Count: 0}, "parseReading with tabs and extra spaces")

	cases := map[string]string{
		"08:00":                      "expected 2 fields, found 1",
		"08:00 412 bikes":            "expected 2 fields, found 3",
		"":                           "expected 2 fields, found 0",
		"08:00 x":                    `count "x": strconv.Atoi: parsing "x": invalid syntax`,
		"08:00 4.5":                  `count "4.5": strconv.Atoi: parsing "4.5": invalid syntax`,
		"08:00 -1":                   "count -1 is negative",
		"412 08:00":                  `count "08:00": strconv.Atoi: parsing "08:00": invalid syntax`,
		"x y z":                      "expected 2 fields, found 3",
		"08:00 -x":                   `count "-x": strconv.Atoi: parsing "-x": invalid syntax`,
		"08:00 99999999999999999999": `count "99999999999999999999": strconv.Atoi: parsing "99999999999999999999": value out of range`,
	}
	for line, want := range cases {
		r, err := parseReading(line)
		check.Error(err, "parseReading rejects a line with a missing, extra or bad field")
		check.Equal(err.Error(), want, "the error message for a rejected line")
		check.Equal(r, Reading{}, "parseReading returns an empty Reading with an error")
	}

	_, err = parseReading("09:00 nine")
	check.ErrorIs(err, strconv.ErrSyntax, "the error for a count that is not a number wraps strconv's error with %w")
}
