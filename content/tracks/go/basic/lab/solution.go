package main

import (
	"bufio"
	"errors"
	"flag"
	"fmt"
	"maps"
	"os"
	"slices"
	"strconv"
	"strings"
)

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

// rowFormat lays out every line of the report, the header included.
const rowFormat = "%-10s %5s %9s %9s %9s %8s"

// parseCents reads an amount such as "4.50" or "12" as a whole number of cents.
func parseCents(text string) (int, error) {
	whole, fraction, hasPoint := strings.Cut(text, ".")
	if !hasPoint {
		fraction = "00"
	}
	// Checking the digits first keeps out what Atoi would accept: "+4", "-4", " 4".
	if len(whole) < 1 || len(whole) > 6 || !allDigits(whole) || len(fraction) != 2 || !allDigits(fraction) {
		return 0, fmt.Errorf("amount %q: %w", text, ErrAmount)
	}
	cents, err := strconv.Atoi(whole + fraction) // "4" and "50" make 450 cents
	if err != nil || cents == 0 {
		return 0, fmt.Errorf("amount %q: %w", text, ErrAmount)
	}
	return cents, nil
}

// allDigits reports whether text is made of the digits 0 to 9 only.
func allDigits(text string) bool {
	for _, r := range text {
		if r < '0' || r > '9' {
			return false
		}
	}
	return true
}

// parseSale reads one line of the sheet, such as "dumplings 4.50 cash".
func parseSale(line string) (Sale, error) {
	fields := strings.Fields(line)
	if len(fields) != 3 {
		return Sale{}, fmt.Errorf("expected 3 fields, found %d", len(fields))
	}
	cents, err := parseCents(fields[1])
	if err != nil {
		return Sale{}, err // already names the amount
	}
	var card bool
	switch strings.ToLower(fields[2]) {
	case "cash":
		card = false
	case "card":
		card = true
	default:
		return Sale{}, fmt.Errorf("payment %q: %w", fields[2], ErrMethod)
	}
	return Sale{Stall: strings.ToLower(fields[0]), Cents: cents, Card: card}, nil
}

// tally adds up the sales of each stall.
func tally(sales []Sale) map[string]Takings {
	totals := make(map[string]Takings)
	for _, s := range sales {
		t := totals[s.Stall] // a missing stall starts from the zero Takings
		t.Sales++
		if s.Card {
			t.Card += s.Cents
		} else {
			t.Cash += s.Cents
		}
		totals[s.Stall] = t
	}
	return totals
}

// formatCents writes cents as units and two decimals: 450 is "4.50".
func formatCents(cents int) string {
	return fmt.Sprintf("%d.%02d", cents/100, cents%100)
}

// report returns the night's table: a header, one row per stall in
// alphabetical order, and a TOTAL row. Each stall pays feePercent of its
// total, rounded down to the cent.
func report(totals map[string]Takings, feePercent int) []string {
	lines := []string{fmt.Sprintf(rowFormat, "stall", "sales", "cash", "card", "total", "fee")}
	var sum Takings
	sumFees := 0
	for _, stall := range slices.Sorted(maps.Keys(totals)) {
		t := totals[stall]
		fee := (t.Cash + t.Card) * feePercent / 100
		lines = append(lines, row(stall, t, fee))
		sum.Sales += t.Sales
		sum.Cash += t.Cash
		sum.Card += t.Card
		sumFees += fee // the sum of the stalls' fees, each rounded down
	}
	return append(lines, row("TOTAL", sum, sumFees))
}

// row formats one line of the report.
func row(name string, t Takings, fee int) string {
	return fmt.Sprintf(rowFormat, name, strconv.Itoa(t.Sales),
		formatCents(t.Cash), formatCents(t.Card), formatCents(t.Cash+t.Card), formatCents(fee))
}

func main() {
	fee := flag.Int("fee", 10, "the market's fee, in percent of each stall's takings")
	flag.Parse()
	if *fee < 0 || *fee > 50 {
		fmt.Fprintln(os.Stderr, "night market: -fee must be from 0 to 50")
		os.Exit(2)
	}
	if flag.NArg() > 0 {
		fmt.Fprintf(os.Stderr, "night market: unexpected argument %q\n", flag.Arg(0))
		os.Exit(2)
	}

	var sales []Sale
	rejected := 0
	scanner := bufio.NewScanner(os.Stdin)
	lineNo := 0
	for scanner.Scan() {
		lineNo++
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		sale, err := parseSale(line)
		if err != nil {
			fmt.Fprintf(os.Stderr, "line %d: %v\n", lineNo, err)
			rejected++
			continue
		}
		sales = append(sales, sale)
	}
	if err := scanner.Err(); err != nil {
		fmt.Fprintln(os.Stderr, "night market: reading input:", err)
		os.Exit(1)
	}

	if len(sales) == 0 {
		fmt.Println("no sales")
	} else {
		for _, line := range report(tally(sales), *fee) {
			fmt.Println(line)
		}
	}
	switch rejected {
	case 0:
		return
	case 1:
		fmt.Fprintln(os.Stderr, "1 line rejected")
	default:
		fmt.Fprintf(os.Stderr, "%d lines rejected\n", rejected)
	}
	os.Exit(1)
}
