Finish `main` in `solution.go`, which writes one menu entry on the chalkboard. The constant
`dishOfTheDay` and the package-level variable `entry` are given; keep their names. The tests run
your program and also put other entries into `entry` and call `main` again, so work everything
out from it.

An entry has three parts separated by semicolons: the name, the fillings and the price. There may
be spaces, tabs or a new line around any part, and the **fillings may contain semicolons
themselves**, as in `galette complète ; ham; egg; cheese ; 9.00`. Replace each placeholder value:

1. **`name`**: the text before the **first** `;`, without the spaces around it. Use
   `strings.Cut` and `strings.TrimSpace`.
2. **`price`**: the text after the **last** `;`, without spaces. `strings.CutLast` (Go 1.27)
   cuts around the last separator.
3. **`fillings`**: the text between the first and the last `;`, without spaces at its ends.
4. **`underline`**: `=` repeated once for every **character** of `name`, not every byte:
   `crêpe suzette` has 13 characters but 14 bytes, because `ê` takes two. You need
   `"unicode/utf8"` in the imports for that.
5. **`special`**: `true` when `name` is the dish of the day, ignoring upper and lower case
   (`CRÊPE SUZETTE` counts), and `false` otherwise, even for a longer name that only contains
   it, such as `crêpe suzette flambée`.

The first line, the name in capitals, is already printed by `strings.ToUpper(name)`. For the
starter's entry the board shows:

```text
CRÊPE SUZETTE
=============
With: orange, butter, sugar
Price: 7.50 euros
Dish of the day: true
```

For `galette complète ; ham; egg; cheese ; 9.00` it shows:

```text
GALETTE COMPLÈTE
================
With: ham; egg; cheese
Price: 9.00 euros
Dish of the day: false
```
