import (
	"iter"
	"slices"
)

// countingBags yields bags of 1, 2, 3 ... kg for ever, and counts how many it
// has produced in *produced.
func countingBags(produced *int) iter.Seq[Bag] {
	return func(yield func(Bag) bool) {
		for kg := 1; ; kg++ {
			*produced++
			if !yield(Bag{Zone: "Test", Kg: float64(kg)}) {
				return
			}
		}
	}
}

func Test(t *testing.T) {
	produced := 0
	got := slices.Collect(take(countingBags(&produced), 3))
	check.Equal(got, []Bag{{"Test", 1}, {"Test", 2}, {"Test", 3}}, "take 3 of an endless sequence")
	check.Equal(produced, 3, "the number of values take 3 asked its source for")

	produced = 0
	check.Equal(slices.Collect(take(countingBags(&produced), 0)), []Bag{}, "take 0 yields nothing")
	check.Equal(produced, 0, "the number of values take 0 asked its source for")
	check.Equal(slices.Collect(take(slices.Values([]int{4, 5}), -1)), []int{}, "take with a negative n yields nothing")
	check.Equal(slices.Collect(take(slices.Values([]int{4, 5}), 5)), []int{4, 5}, "take 5 of a sequence of two")

	produced = 0
	for range take(countingBags(&produced), 5) {
		break
	}
	check.Equal(produced, 1, "the values asked for when the loop over take breaks at once")

	produced = 0
	got = slices.Collect(take(heavier(countingBags(&produced), 4), 2))
	check.Equal(got, []Bag{{"Test", 4}, {"Test", 5}}, "take 2 of the bags of at least 4 kg in an endless sequence")
	check.Equal(produced, 5, "the number of values heavier and take asked their source for")

	list := slices.Values([]Bag{{"A", 2.5}, {"B", 2.25}, {"C", 7}, {"D", 2.5}})
	check.Equal(slices.Collect(heavier(list, 2.5)), []Bag{{"A", 2.5}, {"C", 7}, {"D", 2.5}}, "heavier keeps bags that weigh exactly the minimum")
	var firstHeavy []Bag
	for b := range heavier(list, 2.5) {
		firstHeavy = append(firstHeavy, b)
		break
	}
	check.Equal(firstHeavy, []Bag{{"A", 2.5}}, "a loop over heavier that breaks after the first bag")
}
