// Chalkboard writes one dish on the chalkboard of the Petite Crêperie.
package main

// You may need "unicode/utf8" as well: add it to the imports when you use it.
import (
	"fmt"
	"strings"
)

// The dish of the day, as the owner wrote it on the order pad.
const dishOfTheDay = "Crêpe Suzette"

// One menu entry as the owner types it on the tablet: the name, the fillings
// and the price, separated by semicolons. The tests change it.
var entry = "  crêpe suzette ; orange, butter, sugar ; 7.50  "

func main() {
	// YOUR CODE: replace each placeholder value below (the "" and the false)
	// with what the instructions describe. You may add lines above them, and
	// change := lines into ones that declare several names at once. Keep the
	// names: the Println lines at the bottom print them.
	name := ""
	fillings := ""
	price := ""
	underline := ""
	special := false

	fmt.Println(strings.ToUpper(name))
	fmt.Println(underline)
	fmt.Println("With:", fillings)
	fmt.Println("Price:", price, "euros")
	fmt.Println("Dish of the day:", special)
}
