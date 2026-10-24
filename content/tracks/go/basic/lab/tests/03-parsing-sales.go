import "errors"

func Test(t *testing.T) {
	sale, err := parseSale("dumplings 4.50 cash")
	check.NoError(err, "parseSale of a valid cash sale returns no error")
	check.Equal(sale, Sale{Stall: "dumplings", Cents: 450}, "parseSale of a valid cash sale")

	sale, err = parseSale("  Bao   6.75 \t CARD ")
	check.NoError(err, "parseSale accepts extra spaces, tabs and a method in capitals")
	check.Equal(sale, Sale{Stall: "bao", Cents: 675, Card: true}, "parseSale lower-cases the stall and reads a card sale")

	sale, err = parseSale("CrEpEs 12 Cash")
	check.NoError(err, "parseSale accepts a whole amount and a method in mixed case")
	check.Equal(sale, Sale{Stall: "crepes", Cents: 1200}, "parseSale with a whole amount")

	fieldCounts := map[string]string{
		"churros 2.50":        "expected 3 fields, found 2",
		"churros":             "expected 3 fields, found 1",
		"":                    "expected 3 fields, found 0",
		"hot dogs 3.00 cash":  "expected 3 fields, found 4",
		"bao 6.75 card extra": "expected 3 fields, found 4",
	}
	for line, want := range fieldCounts {
		sale, err := parseSale(line)
		check.Error(err, "parseSale rejects a line without exactly three fields")
		check.Equal(err.Error(), want, "the error for a line without exactly three fields")
		check.Equal(sale, Sale{}, "parseSale returns an empty Sale with an error")
	}

	sale, err = parseSale("bao 6,75 card")
	check.True(errors.Is(err, ErrAmount), "a bad amount gives an error wrapping ErrAmount")
	check.Equal(err.Error(), `amount "6,75": not a valid amount`, "the error for a bad amount is parseCents's error")
	check.Equal(sale, Sale{}, "parseSale returns an empty Sale for a bad amount")

	sale, err = parseSale("bao 6.75 PayPal")
	check.True(errors.Is(err, ErrMethod), "an unknown payment method gives an error wrapping ErrMethod")
	check.Equal(err.Error(), `payment "PayPal": unknown payment method`, "the error quotes the method as written")
	check.True(err != ErrMethod, "ErrMethod is wrapped with the method, not returned as it is")
	check.Equal(sale, Sale{}, "parseSale returns an empty Sale for an unknown method")

	_, err = parseSale("bao 0.00 cheque")
	check.True(errors.Is(err, ErrAmount), "parseSale checks the amount before the method")
	_, err = parseSale("bao 6.75 cards")
	check.True(errors.Is(err, ErrMethod), "parseSale accepts only the words cash and card")
}
