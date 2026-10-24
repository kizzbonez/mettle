import "errors"

func Test(t *testing.T) {
	good := map[string]int{
		"4.50": 450, "12": 1200, "0.05": 5, "007.00": 700, "1": 100,
		"0.10": 10, "999999.99": 99999999, "250": 25000,
	}
	for text, want := range good {
		cents, err := parseCents(text)
		check.NoError(err, "parseCents of a valid amount returns no error")
		check.Equal(cents, want, "the cents parseCents reads from a valid amount")
	}

	bad := []string{
		"4.5", "4.", ".50", "4.500", "3,20", "-4.00", "+4.00", "+4", "0.00", "0", "000",
		"1234567", "1234567.00", "", ".", "4.5a", "1e3", "4..50", "4.-5", "£4.50", "4.5O",
	}
	for _, text := range bad {
		cents, err := parseCents(text)
		check.True(errors.Is(err, ErrAmount), "parseCents rejects a malformed or zero amount with ErrAmount")
		check.Equal(cents, 0, "parseCents returns 0 cents with an error")
	}

	_, err := parseCents("4.5")
	check.Equal(err.Error(), `amount "4.5": not a valid amount`, `the error message for "4.5"`)
	_, err = parseCents("")
	check.Equal(err.Error(), `amount "": not a valid amount`, "the error message for an empty amount")
	check.True(err != ErrAmount, "ErrAmount is wrapped with the amount, not returned as it is")

	cents := map[int]string{
		450: "4.50", 5: "0.05", 0: "0.00", 123456: "1234.56", 100: "1.00", 99: "0.99",
		10: "0.10", 1000000: "10000.00",
	}
	for n, want := range cents {
		check.Equal(formatCents(n), want, "formatCents writes units, a point and two digits")
	}
}
