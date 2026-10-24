Finish the shift board in `solution.go`. The constant `gondolas` and the package-level variables
`operator`, `attendant` and `closed` are given; keep their names. The tests run your program and
also change those variables and call `main` again, so work everything out from them instead of
typing the answers.

1. **A constant.** Below `gondolas`, declare the constant `seatsPerGondola` with the value `4`.
2. **Short declarations.** In `main`, in place of the `panic`, declare with `:=`
   - `inService`: the gondolas that are not closed (`gondolas` minus `closed`);
   - `seats`: `inService` times `seatsPerGondola`;

   and print them as `Gondolas in service: 15` and `Seats today: 60`.
3. **The morning line.** Print `Morning: Mo at the controls, Ade at the gate`, using the two
   variables. `fmt.Println` puts a space between its values, so pass the comma as part of a
   string: `"at the controls,"`.
4. **The swap.** At noon the two swap places. Swap the values of the package-level variables
   `operator` and `attendant` themselves, with one assignment (`=`, not `:=`), then print the
   afternoon line in the same way: `Afternoon: Ade at the controls, Mo at the gate`. A test
   checks that the two variables hold the swapped names after `main` has run.
5. **A zero value.** Declare `rides` with `var` and an `int` type but no value, and print it as
   `Rides so far today: 0`.

With the numbers in the starter, the board is:

```text
Riverside Fair Ferris Wheel
Gondolas in service: 15
Seats today: 60
Morning: Mo at the controls, Ade at the gate
Afternoon: Ade at the controls, Mo at the gate
Rides so far today: 0
```

With `operator = "Lin"`, `attendant = "Raf"` and `closed = 0`, the middle lines become
`Gondolas in service: 18`, `Seats today: 72`, `Morning: Lin at the controls, Raf at the gate` and
`Afternoon: Raf at the controls, Lin at the gate`.

If the build stops with `declared and not used`, you declared a variable and never printed it.
