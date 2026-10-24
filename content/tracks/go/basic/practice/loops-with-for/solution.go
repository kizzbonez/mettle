package main

import (
	"fmt"
	"strings"
)

// The day's timetable. Times are minutes after midnight, so 10*60 + 20 is
// 10:20. The tests give these variables other values and run main again.
var (
	first = 10*60 + 20 // the first bus leaves at 10:20
	every = 25         // minutes between two buses (always at least 1)
	last  = 13*60 + 30 // no bus leaves after 13:30
	lunch = 12         // no bus leaves in this hour, the driver's lunch
	now   = 11*60 + 12 // a passenger reaches the stop at 11:12
)

func main() {
	var departures strings.Builder
	buses := 0
	next := -1 // the first bus at or after now; -1 until one is found

	for t := first; t <= last; t += every {
		if t/60 == lunch {
			continue // the bus keeps its rhythm, but this one does not run
		}
		if buses > 0 {
			departures.WriteString(" ")
		}
		departures.WriteString(fmt.Sprintf("%02d:%02d", t/60, t%60))
		buses++
		if next == -1 && t >= now {
			next = t
		}
	}

	if buses == 0 {
		fmt.Println("no buses")
	} else {
		fmt.Println(departures.String())
	}
	fmt.Println("buses:", buses)
	if next == -1 {
		fmt.Printf("next after %02d:%02d: none\n", now/60, now%60)
	} else {
		fmt.Printf("next after %02d:%02d: %02d:%02d\n", now/60, now%60, next/60, next%60)
	}
}
