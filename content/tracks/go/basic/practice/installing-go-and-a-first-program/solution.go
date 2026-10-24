// Banner prints the banner on the lobby screen of the Starfield
// Planetarium when the evening shows begin.
//
// Two slashes // make the rest of a line a comment, which the compiler skips.
package main

import "fmt"

func main() {
	fmt.Println("==============================")
	fmt.Println("  Starfield Planetarium")
	fmt.Println("  Tonight: The Northern Sky")
	fmt.Println("==============================")

	// Println prints its values with a space between them; it has no use for
	// formatting directives such as %s, which belong to fmt.Printf.
	fmt.Println("Doors open at 19:30")
	fmt.Println("Show starts at", "20:00")
	fmt.Println("Please switch off your phone")
}
