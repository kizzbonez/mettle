import "strings"

// moneyLines runs main for one cut and returns the lines of its label.
func moneyLines(weight int, price float64, fat int) []string {
	grams, pricePerKg, fatPercent = weight, price, fat
	lines := strings.Split(check.PrintedBy(main), "\n")
	check.True(len(lines) >= 5, "the label has five lines")
	return lines
}

func Test(t *testing.T) {
	lines := moneyLines(1500, 31.5, 50)
	check.Equal(lines[2], "Fat 50% in dry matter", "the fat line, with a percent sign")
	check.Equal(lines[3], "31.50 EUR/kg", "a price per kilo with two decimals")
	check.Equal(lines[4], "To pay:    47.25 EUR", "the price to pay, eight characters wide with two decimals")

	lines = moneyLines(80, 19.9, 0)
	check.Equal(lines[2], "Fat 0% in dry matter", "the fat line for a fat-free cheese")
	check.Equal(lines[3], "19.90 EUR/kg", "a price per kilo that needs a trailing zero")
	check.Equal(lines[4], "To pay:     1.59 EUR", "a price to pay that has to be rounded to two decimals")

	lines = moneyLines(52000, 25, 48)
	check.Equal(lines[3], "25.00 EUR/kg", "a whole price per kilo, with two decimals")
	check.Equal(lines[4], "To pay:  1300.00 EUR", "a four-digit price to pay, eight characters wide")
}
