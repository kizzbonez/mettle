package main

import (
	"fmt"
	"strings"
)

// One customer at the hire desk. The tests give these variables other values
// and run main again.
var (
	boat  = "Tandem" // the boat the customer asks for, as the desk typed it
	hours = 3        // how many hours they want it for
	wind  = 18       // the wind speed in km/h, from the harbour's gauge
)

func main() {
	// Write your code here, in place of the line below: decide the boat's
	// rate with a switch, the water with a switch that has no condition, and
	// print the three lines the instructions show.
	fmt.Println(strings.TrimSpace(boat), hours, wind)
}
