import (
	"errors"
	"strings"
)

var errFuseBlown = errors.New("fuse blown")

func Test(t *testing.T) {
	lb := &Logbook{}
	err := inspect([]string{"Vault", "Lab"}, func(door string) error {
		if door == "Lab" {
			panic(errFuseBlown)
		}
		return nil
	}, lb)
	check.ErrorIs(err, errFuseBlown, "a panic whose value is an error is wrapped with %w")
	check.Equal(err.Error(), "door Lab: panic: fuse blown", "the message for a panic with an error value")
	check.Equal(lb.Lines, []string{"unlock Vault", "unlock Lab", "lock Lab", "lock Vault"}, "the log when a probe panics with an error")

	lb = &Logbook{}
	err = inspect([]string{"Cellar", "Vault"}, func(door string) error {
		var counts map[string]int
		counts[door]++ // a run-time panic: the map is nil
		return nil
	}, lb)
	check.Error(err, "a run-time panic in the first probe becomes an error")
	check.True(strings.HasPrefix(err.Error(), "door Cellar: panic: "), "the message for a run-time panic names the door")
	check.True(strings.Contains(err.Error(), "nil map"), "the message for a run-time panic includes the panic value")
	check.Equal(lb.Lines, []string{"unlock Cellar", "lock Cellar"}, "the log when the first probe panics")

	lb = &Logbook{}
	err = inspect([]string{"Attic"}, func(string) error { panic(42) }, lb)
	check.Equal(err.Error(), "door Attic: panic: 42", "the message for a panic with a number")

	check.Equal(mustDoors("Cellar"), []string{"Cellar"}, `mustDoors of one name`)
	check.Equal(mustDoors("  Vault ,Lab,  Attic  "), []string{"Vault", "Lab", "Attic"}, "mustDoors removes the spaces around each name")
	for _, spec := range []string{"", "Vault, ", " ,Lab", "Vault,,Lab"} {
		value := check.Panics(func() { mustDoors(spec) }, "mustDoors panics on a list with an empty name")
		check.Equal(value, any(`mustDoors: empty door name in "`+spec+`"`), "the panic value of mustDoors for a list with an empty name")
	}
}
