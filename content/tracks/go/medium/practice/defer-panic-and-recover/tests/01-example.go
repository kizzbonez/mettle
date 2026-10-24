func Test(t *testing.T) {
	lb := &Logbook{}
	err := inspect([]string{"Vault", "Library"}, func(door string) error { return nil }, lb)
	check.NoError(err, "inspect of two doors whose probes pass")
	check.Equal(lb.Lines, []string{"unlock Vault", "unlock Library", "all clear", "lock Library", "lock Vault"}, "the log of a reset where every probe passes")

	lb = &Logbook{}
	err = inspect([]string{"Vault", "Library", "Attic"}, func(door string) error {
		if door == "Library" {
			panic("bookcase stuck")
		}
		return nil
	}, lb)
	check.Error(err, "inspect returns an error when a probe panics")
	check.Equal(err.Error(), "door Library: panic: bookcase stuck", "the message for a probe that panics")
	check.Equal(lb.Lines, []string{"unlock Vault", "unlock Library", "lock Library", "lock Vault"}, "the log of a reset where the second probe panics")

	check.Equal(mustDoors("Vault, Library,Attic"), []string{"Vault", "Library", "Attic"}, `mustDoors("Vault, Library,Attic")`)
	value := check.Panics(func() { mustDoors("Vault,,Attic") }, `mustDoors("Vault,,Attic") panics`)
	check.Equal(value, any(`mustDoors: empty door name in "Vault,,Attic"`), `the panic value of mustDoors("Vault,,Attic")`)
}
