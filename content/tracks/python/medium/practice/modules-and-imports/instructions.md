Write `solution.py`, a module. The tests import it and call its two functions, and they also run
it as a program with `python solution.py`.

The organisers keep the day's raffle in their own module, `raffle_data.py`, which defines
`TICKETS` (a list of ticket numbers), `PRIZES` (a list of prize names) and `SEED` (an int). In
this lab it is in the folder `data/`, which is on the module search path, so `import raffle_data`
finds it as if it sat next to your file.

1. At the top of the file, import the standard module `random` and the module `raffle_data`.
2. `draw(tickets, prizes, seed)` returns a list of `(prize, ticket)` tuples. It first calls
   `random.seed(seed)`, then picks the winning tickets with **one** call of
   `random.sample(tickets, n)`, where `n` is the number of prizes, or the number of tickets when
   there are fewer tickets than prizes. It pairs the prizes, in their order, with the tickets in
   the order `sample` returned them. With no tickets or no prizes the list is empty. The lists
   passed in are not changed.
3. `public_names(module)` returns, as a list, the names that `dir(module)` gives which do not
   start with an underscore, in the order `dir` gives them.
4. When the file is run as a program, and only then, it prints one line `PRIZE: ticket TICKET`
   for each pair of `draw(raffle_data.TICKETS, raffle_data.PRIZES, raffle_data.SEED)`.
   Importing your file must print nothing.

Example, with the organisers' `data/raffle_data.py`:

```python
TICKETS = list(range(101, 121))
PRIZES = ["hamper", "kite", "voucher"]
SEED = 2026
```

```python
draw(list(range(101, 121)), ["hamper", "kite", "voucher"], 2026)
# [('hamper', 104), ('kite', 111), ('voucher', 117)]
draw([5, 9], ["hamper", "kite", "voucher"], 7)   # two pairs: only two tickets were sold
public_names(raffle_data)                        # ['PRIZES', 'SEED', 'TICKETS']
import math
public_names(math)[:4]                           # ['acos', 'acosh', 'asin', 'asinh']
```

```console
$ python solution.py
hamper: ticket 104
kite: ticket 111
voucher: ticket 117
```

The organisers change `raffle_data.py` from one fair to the next, so take the tickets, prizes
and seed from it rather than copying its values into your file.

**Tip.** `zip` pairs two lists and stops at the shorter one, and `min` picks the smaller of two
numbers.
