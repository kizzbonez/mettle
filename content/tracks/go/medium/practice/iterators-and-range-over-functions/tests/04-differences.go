import (
	"iter"
	"slices"
)

// trackedScale yields the readings, then for ever repeats the last one when
// endless is true. It sets *finished when the iterator function returns.
func trackedScale(readings []float64, endless bool, finished *bool) iter.Seq[float64] {
	return func(yield func(float64) bool) {
		defer func() { *finished = true }()
		for _, r := range readings {
			if !yield(r) {
				return
			}
		}
		for endless {
			if !yield(readings[len(readings)-1]) {
				return
			}
		}
	}
}

func Test(t *testing.T) {
	a := slices.Values([]float64{2, 4.5})
	b := slices.Values([]float64{1.5, 4.75, 9})
	check.Equal(differences(a, b), []float64{0.5, -0.25}, "differences when the first scale runs out first")
	check.Equal(differences(slices.Values([]float64{}), b), []float64{}, "differences when the first scale has no readings")
	check.Equal(differences(b, b), []float64{0, 0, 0}, "differences of a scale with itself")

	var doneA, doneB bool
	got := differences(trackedScale([]float64{5}, true, &doneA), trackedScale([]float64{1, 2, 3.5}, false, &doneB))
	check.Equal(got, []float64{4, 3, 1.5}, "differences of an endless scale and one with three readings")
	check.True(doneB, "the scale that ran out has finished")
	check.True(doneA, "the endless scale is stopped when differences returns")

	doneA, doneB = false, false
	got = differences(trackedScale([]float64{8, 6}, false, &doneA), trackedScale([]float64{0.5}, true, &doneB))
	check.Equal(got, []float64{7.5, 5.5}, "differences of a scale with two readings and an endless one")
	check.True(doneA && doneB, "both scales have finished when differences returns")
}
