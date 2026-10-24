// Quote prints a quote for tiling a floor at the Hilltop Tile Shop.
package main

import (
	"fmt"
	"math"
	"strconv"
)

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
	// The reference joins text and numbers, so the numbers become text first.
	ref := "Q-" + strconv.Itoa(widthCm) + "x" + strconv.Itoa(lengthCm)

	// 10,000 square centimetres make a square metre. Convert before dividing,
	// or the integer division would drop the fraction.
	area := math.Round(float64(widthCm*lengthCm)/10000*100) / 100

	// A row that ends in part of a tile still needs a whole tile, so round up.
	across := int(math.Ceil(float64(widthCm) / tileCm))
	along := int(math.Ceil(float64(lengthCm) / tileCm))
	total := across * along

	// Boxes cannot be split either: round up, then count what is left over.
	boxes := int(math.Ceil(float64(total) / tilesPerBox))
	spare := boxes*tilesPerBox - total

	// Money is shown with exactly two decimals.
	price := strconv.FormatFloat(float64(boxes)*boxPrice, 'f', 2, 64)

	fmt.Println("Quote", ref)
	fmt.Println("Floor area:", area, "square metres")
	fmt.Println("Tiles:", across, "across,", along, "along,", total, "in all")
	fmt.Println("Boxes:", boxes, "with", spare, "tiles spare")
	fmt.Println("Price:", price, "euros")
}
