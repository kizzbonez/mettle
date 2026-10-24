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
	// The desk types names in any case and with stray spaces.
	kind := strings.ToLower(strings.TrimSpace(boat))

	// The hourly rate in euros; 0 means the hut has no such boat.
	rate := 0
	switch kind {
	case "single", "solo":
		rate = 12
	case "tandem", "double":
		rate = 20
	case "canoe":
		rate = 25
	}
	if rate == 0 {
		fmt.Printf("boat: unknown %q\n", boat)
	} else {
		fmt.Printf("boat: %s, %d an hour\n", kind, rate)
	}

	// The narrowest band comes first: the first true case wins.
	water := "closed"
	switch {
	case wind < 20:
		water = "open sea"
	case wind < 35:
		water = "sheltered bay only"
	}
	fmt.Println("water:", water)

	// Nobody pays for more than four hours: that is the day price.
	charged := hours
	if charged > 4 {
		charged = 4
	}
	if rate == 0 || water == "closed" {
		fmt.Println("to pay: nothing, no hire")
	} else {
		fmt.Println("to pay:", charged*rate)
	}
}
