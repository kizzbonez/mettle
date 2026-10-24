// Kilos is a named float type, to check that Total accepts more than Cents.
type Kilos float64

func Test(t *testing.T) {
	check.Equal(Total([]int{1, 2, 3, 4}), 10, "Total of four ints")
	check.Near(Total([]float64{0.5, 1.25, 2}), 3.75, 1e-9, "Total of three float64 values")
	check.Equal(Total([]Cents{}), Cents(0), "Total of no prices")
	check.Equal(Total([]Cents{250}), Cents(250), "Total of one price")
	check.Near(float64(Total([]Kilos{1.5, 2.5})), 4.0, 1e-9, "Total of a named float type")
	check.Equal(Total([]int{-5, 5, -2}), -2, "Total with negative values")

	check.Equal(Tally([]int{3, 1, 3, 3, 2}), map[int]int{1: 1, 2: 1, 3: 3}, "Tally of ints")
	check.Equal(Tally([]string{}), map[string]int{}, "Tally of no items")
	check.Equal(Tally([]Cents{850, 850}), map[Cents]int{850: 2}, "Tally of a named type")
	type stall struct {
		Row  string
		Spot int
	}
	got := Tally([]stall{{"A", 1}, {"B", 2}, {"A", 1}})
	check.Equal(got, map[stall]int{{"A", 1}: 2, {"B", 2}: 1}, "Tally of comparable structs")
}
