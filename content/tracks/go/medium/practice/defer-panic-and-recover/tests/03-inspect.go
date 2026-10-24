import "errors"

var errClueMissing = errors.New("clue card missing")

func Test(t *testing.T) {
	lb := &Logbook{}
	var probed []string
	err := inspect([]string{"Vault", "Library", "Attic", "Cellar"}, func(door string) error {
		probed = append(probed, door)
		if door == "Attic" {
			return errClueMissing
		}
		return nil
	}, lb)
	check.ErrorIs(err, errClueMissing, "the error of a failed probe is wrapped with %w")
	check.Equal(err.Error(), "door Attic: clue card missing", "the message for a failed probe")
	check.Equal(probed, []string{"Vault", "Library", "Attic"}, "the doors probed before the first failure")
	check.Equal(lb.Lines, []string{"unlock Vault", "unlock Library", "unlock Attic", "lock Attic", "lock Library", "lock Vault"}, "the log when the third probe fails")

	lb = &Logbook{}
	err = inspect([]string{"Vault"}, func(door string) error { return errClueMissing }, lb)
	check.ErrorIs(err, errClueMissing, "the error when the only probe fails")
	check.Equal(lb.Lines, []string{"unlock Vault", "lock Vault"}, "the log when the only probe fails")

	lb = &Logbook{}
	doors := []string{"A", "B", "C", "D", "E"}
	check.NoError(inspect(doors, func(string) error { return nil }, lb), "inspect of five doors that all pass")
	want := []string{"unlock A", "unlock B", "unlock C", "unlock D", "unlock E", "all clear", "lock E", "lock D", "lock C", "lock B", "lock A"}
	check.Equal(lb.Lines, want, "the log of five doors that all pass")

	lb = &Logbook{}
	check.NoError(inspect(nil, func(string) error { return nil }, lb), "inspect of no doors at all")
	check.Equal(lb.Lines, []string{"all clear"}, "the log of a reset with no doors")
}
