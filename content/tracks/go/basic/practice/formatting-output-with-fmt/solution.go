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

	// The label: every field has a fixed width so that the columns line up
	// on the wrapper, whatever the values are.
	fmt.Printf("Label %05d\n", labelNo)
	fmt.Printf("%-12s%5d g\n", cheese, grams)
	fmt.Printf("Fat %d%% in dry matter\n", fatPercent)
	fmt.Printf("%.2f EUR/kg\n", pricePerKg)
	fmt.Printf("To pay: %8.2f EUR\n", toPay)

	// The scale's log goes to standard error, so it never ends up on a label.
	fmt.Fprintf(os.Stderr, "label %d printed for %q\n", labelNo, cheese)
}
