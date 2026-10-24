// Board prints the morning shift board in the ticket booth of the
// Riverside Fair's Ferris wheel.
package main

import "fmt"

// The wheel has this many gondolas. That never changes, so it is a constant.
const gondolas = 18

// Each gondola seats this many riders.
const seatsPerGondola = 4

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

	inService := gondolas - closed
	seats := inService * seatsPerGondola
	fmt.Println("Gondolas in service:", inService)
	fmt.Println("Seats today:", seats)

	fmt.Println("Morning:", operator, "at the controls,", attendant, "at the gate")

	// The two swap at noon. Both values on the right are read before either
	// variable changes, so no temporary variable is needed.
	operator, attendant = attendant, operator
	fmt.Println("Afternoon:", operator, "at the controls,", attendant, "at the gate")

	// A variable declared without a value starts at its zero value, 0.
	var rides int
	fmt.Println("Rides so far today:", rides)
}
