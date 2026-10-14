The tests make a folder holding `orders.txt` (one order per line) and `kitchen.log`, and on some
days `extras.txt`, go into it and run your script there:

```bash
bash solution.sh
```

Write one line for each task, in this order:

1. Save the orders, sorted, in `sorted.txt`. An old `sorted.txt` from yesterday may be there; it
   is replaced.
2. Print the number of orders: only the number, without the file name.
3. Print the first three of the sorted orders, and save the same lines in `first.txt`, in one
   pipeline. When there are fewer than three orders, print and save the ones there are.
4. Add the line `tally done` at the end of `kitchen.log`, keeping everything already in it.
5. Print the contents of `extras.txt`. On days without it, print nothing for this task, and no
   error message either.

Nothing may appear on standard error, and `orders.txt` must stay as it was. For the visible test,
`orders.txt` holds

```text
soup
salad
noodles
chili
soup
risotto
```

and there is no `extras.txt`. The script prints

```text
6
chili
noodles
risotto
```

and afterwards `sorted.txt` holds all six orders in order, `first.txt` holds the three lines
printed, and `kitchen.log` ends with `tally done`. The hidden tests use a stale `sorted.txt`, a
`kitchen.log` with several lines, a day with no orders at all, and a day with extras.
