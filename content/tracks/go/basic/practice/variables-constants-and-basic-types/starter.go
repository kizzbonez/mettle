// Board prints the morning shift board in the ticket booth of the
// Riverside Fair's Ferris wheel.
package main

import "fmt"

// The wheel has this many gondolas. That never changes, so it is a constant.
const gondolas = 18

// TASK 1: declare the constant seatsPerGondola here, with the value 4.

// Today's numbers, which the manager types in every morning. They are
// package-level variables: declared with var, outside every function, so that
// main can use them. The tests give them other values too.
var (
	operator  = "Mo"  // at the controls in the morning
	attendant = "Ade" // at the boarding gate in the morning
	closed    = 3     // gondolas closed for repair today
)

func main() {
	fmt.Println("Riverside Fair Ferris Wheel")

	// YOUR CODE: replace the panic below with the rest of the board.
	// TASK 2: declare inService and seats with :=, and print both lines.
	// TASK 3: print the morning line.
	// TASK 4: swap operator and attendant with one assignment, then print
	//         the afternoon line.
	// TASK 5: declare rides with var and no value, and print it.
	panic("not implemented")
}
