// Your first lab: a program that prints the board by the door of the ice rink.
//
// How a lab works:
//  1. Press Run. Go compiles this program, then the first test runs it and
//     compares what it printed with what the board should say, line by line.
//  2. Read the test's message. It names the first line that is wrong and shows
//     what the test expected and what the program actually printed.
//  3. Make the one change the instructions ask for, on the line marked CHANGE.
//  4. Press Run again. When the test passes, press Submit, which also runs
//     the hidden tests.
package main

import "fmt"

// main runs when the program starts. Each fmt.Println prints one line of the
// board: the values between its parentheses, with a space between them.
func main() {
	fmt.Println("Welcome to Northgate Ice Rink")
	fmt.Println("Public skating every day from", 10, "to", 18)
	// CHANGE the number on the next line: skate hire now costs 4 euros, not 3.
	fmt.Println("Skate hire:", 4, "euros")
	fmt.Println("Hours on the ice each day:", 18-10)
	fmt.Println("Gloves are required on the ice")
}
