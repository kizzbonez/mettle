package main

import "errors"

// Add the other packages you use to the imports: you will need bufio, flag,
// fmt, os, strconv and strings, and maps and slices for the sorted keys.

// Sale is one line of the night's sales sheet.
type Sale struct {
	Stall string // in lower case
	Cents int
	Card  bool // false means cash
}

// Takings is one stall's money for the night.
type Takings struct {
	Sales int // how many sales
	Cash  int // cents paid in cash
	Card  int // cents paid by card
}

// The sentinel errors that parseCents and parseSale wrap. Keep them as they are.
var (
	ErrAmount = errors.New("not a valid amount")
	ErrMethod = errors.New("unknown payment method")
)

// rowFormat lays out every line of the report, the header included:
// fmt.Sprintf(rowFormat, a, b, c, d, e, f) with six strings.
const rowFormat = "%-10s %5s %9s %9s %9s %8s"

// parseCents reads an amount such as "4.50" or "12" as a whole number of cents.
func parseCents(text string) (int, error) {
	panic("not implemented")
}

// parseSale reads one line of the sheet, such as "dumplings 4.50 cash".
func parseSale(line string) (Sale, error) {
	panic("not implemented")
}

// tally adds up the sales of each stall.
func tally(sales []Sale) map[string]Takings {
	panic("not implemented")
}

// formatCents writes cents as units and two decimals: 450 is "4.50".
func formatCents(cents int) string {
	panic("not implemented")
}

// report returns the night's table: a header, one row per stall in
// alphabetical order, and a TOTAL row.
func report(totals map[string]Takings, feePercent int) []string {
	panic("not implemented")
}

func main() {
	// Read the -fee flag, then the sheet on standard input, as the instructions say.
	panic("not implemented")
}
