// Chalkboard writes one dish on the chalkboard of the Petite Crêperie.
package main

import (
	"fmt"
	"strings"
	"unicode/utf8"
)

// The dish of the day, as the owner wrote it on the order pad.
const dishOfTheDay = "Crêpe Suzette"

// One menu entry as the owner types it on the tablet: the name, the fillings
// and the price, separated by semicolons. The tests change it.
var entry = "  crêpe suzette ; orange, butter, sugar ; 7.50  "

func main() {
	// The name ends at the first semicolon and the price starts after the
	// last one, so the fillings in between may contain semicolons too.
	name, rest, _ := strings.Cut(entry, ";")
	fillings, price, _ := strings.CutLast(rest, ";")
	name = strings.TrimSpace(name)
	fillings = strings.TrimSpace(fillings)
	price = strings.TrimSpace(price)

	// One = per character: count runes, because ê takes two bytes.
	underline := strings.Repeat("=", utf8.RuneCountInString(name))

	// The owner types names in any case, so compare without it.
	special := strings.EqualFold(name, dishOfTheDay)

	fmt.Println(strings.ToUpper(name))
	fmt.Println(underline)
	fmt.Println("With:", fillings)
	fmt.Println("Price:", price, "euros")
	fmt.Println("Dish of the day:", special)
}
