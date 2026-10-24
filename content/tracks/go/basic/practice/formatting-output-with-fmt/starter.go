package main

import (
	"fmt"
	"os"
)

// One cut of cheese, as the scale weighed it. The tests give these variables
// other values and run main again, so print them with verbs: never type a
// value into the text.
var (
	labelNo    = 42
	cheese     = "Comté"
	grams      = 325
	pricePerKg = 24.9
	fatPercent = 45
)

func main() {
	// The price of this cut, in euros.
	toPay := float64(grams) / 1000 * pricePerKg

	// Write your lines here, in place of the two below: five Printf lines for
	// the label, then one Fprintf line for the log on standard error.
	fmt.Println(labelNo, cheese, grams, pricePerKg, fatPercent, toPay)
	fmt.Fprintln(os.Stderr, "log line not written yet")
}
