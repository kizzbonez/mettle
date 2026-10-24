// Quote prints a quote for tiling a floor at the Hilltop Tile Shop.
package main

// You will need the packages "math" and "strconv" as well: add them to the
// import list, as lesson 2 showed. (Go refuses imports that are not used,
// which is why they are not here yet.)
import "fmt"

// The shop sells one kind of floor tile, in boxes.
const (
	tileCm      = 25   // each tile is a square, 25 cm on each side
	tilesPerBox = 12   // tiles in one box
	boxPrice    = 31.5 // euros for one box
)

// The customer's room, measured in whole centimetres. The tests change these.
var (
	widthCm  = 340
	lengthCm = 275
)

func main() {
	// YOUR CODE: replace each placeholder value below (the "", 0.0 and 0)
	// with the calculation from the instructions. Keep the names: the
	// Println lines at the bottom print them.
	ref := ""
	area := 0.0
	across := 0
	along := 0
	total := 0
	boxes := 0
	spare := 0
	price := ""

	fmt.Println("Quote", ref)
	fmt.Println("Floor area:", area, "square metres")
	fmt.Println("Tiles:", across, "across,", along, "along,", total, "in all")
	fmt.Println("Boxes:", boxes, "with", spare, "tiles spare")
	fmt.Println("Price:", price, "euros")
}
