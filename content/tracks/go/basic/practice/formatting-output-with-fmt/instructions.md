The starter declares the cut of cheese the scale has just weighed: `labelNo`, `cheese`, `grams`,
`pricePerKg` and `fatPercent`, and `main` works out `toPay`, the price in euros. Replace the two
placeholder lines at the end of `main` with the lines below. The tests give the variables other
values and run `main` again, so every value must come from a verb, never be typed into the text.

Print these five lines to standard output with `fmt.Printf`, each ending in a newline:

1. `Label ` followed by `labelNo` with at least five digits, padded with zeros: `Label 00042`.
   A longer number is printed whole.
2. `cheese` left-aligned in a field 12 characters wide, then `grams` right-aligned in a field
   5 characters wide, then ` g`. Nothing else goes between the two fields.
3. `Fat `, `fatPercent`, a percent sign, then ` in dry matter`.
4. `pricePerKg` with exactly two decimals, then ` EUR/kg`.
5. `To pay: ` (with its space), then `toPay` with two decimals in a field 8 characters wide, then
   ` EUR`.

Then:

6. Print the log line to **standard error** with `fmt.Fprintf(os.Stderr, ...)`: `label `, the
   label number as it is, ` printed for `, and the cheese's name in double quotes using the
   verb that adds them.

With the starter's values, standard output is:

```text
Label 00042
Comté         325 g
Fat 45% in dry matter
24.90 EUR/kg
To pay:     8.09 EUR
```

and standard error is:

```text
label 42 printed for "Comté"
```

Line 2 has nine spaces between `Comté` and `325`: seven fill the name's field of 12 characters,
because `Comté` has five characters (even though it is six bytes), and two fill the weight's
field of 5. With `cheese = "Saint-Nectaire"`, which is longer than 12 characters, and
`grams = 400`, line 2 is `Saint-Nectaire  400 g`.
