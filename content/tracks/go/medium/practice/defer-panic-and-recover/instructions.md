Complete the three functions in `solution.go`. `Logbook` and its `add` method are given; every
line your functions log goes through `lb.add`. Add `"fmt"` and `"strings"` to the imports when
you use them.

1. **`section(name string, lb *Logbook) func()`** logs `begin <name>` at once and returns a
   function that logs `end <name>` when it is called. It is meant for
   `defer section("reset", lb)()`: the call to `section` runs when the `defer` statement runs,
   and only the function it returns is deferred.
2. **`inspect(doors []string, probe func(door string) error, lb *Logbook) (err error)`** goes
   through the doors in order. For each door it logs `unlock <door>` and then calls
   `probe(door)`.
   - If every probe returns nil, log `all clear` and return nil.
   - If a probe returns an error, stop: do not unlock any more doors, and return the error
     wrapped as `door <door>: <the error>` with `%w`.
   - If a probe **panics**, `inspect` must not panic. Stop and return an error
     `door <door>: panic: <the panic value>`. When the panic value is itself an `error`, wrap it
     with `%w`, so that `errors.Is` still finds it; otherwise format it with `%v`.
   - However `inspect` returns, every door it unlocked is locked again **in reverse order**,
     each logging `lock <door>`, after everything else that `inspect` logs. Use `defer`.
3. **`mustDoors(spec string) []string`** splits a list of door names written in the program,
   such as `"Vault, Library,Attic"`, at the commas and removes the spaces around each name. If a
   name is empty after that, it panics with the string
   `mustDoors: empty door name in "<spec>"` (use `%q` for the spec).

```go
lb := &Logbook{}
err := inspect([]string{"Vault", "Library"}, func(door string) error { return nil }, lb)
// err == nil
// lb.Lines: unlock Vault, unlock Library, all clear, lock Library, lock Vault

lb = &Logbook{}
err = inspect([]string{"Vault", "Library", "Attic"}, func(door string) error {
	if door == "Library" {
		panic("bookcase stuck")
	}
	return nil
}, lb)
// err.Error() == "door Library: panic: bookcase stuck"
// lb.Lines: unlock Vault, unlock Library, lock Library, lock Vault

mustDoors("Vault, Library,Attic") // []string{"Vault", "Library", "Attic"}
mustDoors("Vault,,Attic")         // panics: mustDoors: empty door name in "Vault,,Attic"
```
