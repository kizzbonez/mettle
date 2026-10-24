The starter declares one customer: `boat`, the boat they ask for as the desk typed it, `hours`,
how long they want it, and `wind`, the wind speed in km/h. Write `main` so that it prints three
lines. The tests give the variables other values and run `main` again.

1. **The boat.** Remove the spaces around `boat` and put it in lower case (`strings.TrimSpace`,
   `strings.ToLower`). Then use a `switch` on it to find the rate per hour, in euros:

   | boat                    | rate |
   | ----------------------- | ---- |
   | `single` or `solo`      | 12   |
   | `tandem` or `double`    | 20   |
   | `canoe`                 | 25   |

   Print `boat: <name>, <rate> an hour` with the cleaned-up name, for example
   `boat: canoe, 25 an hour`. For any other boat, print `boat: unknown ` followed by `boat` exactly
   as it was typed, in double quotes (`%q`): `boat: unknown " Raft"`.
2. **The water.** Use a `switch` with no condition on `wind`. Under 20 the line is
   `water: open sea`; from 20 up to 34 it is `water: sheltered bay only`; at 35 or more it is
   `water: closed`. Print this line for every boat, known or not.
3. **The price.** A hire costs the rate times the hours, but never more than four hours: from
   four hours on, the customer pays the price of four. Print `to pay: <euros>`. When the boat is
   unknown, or the water is closed, print `to pay: nothing, no hire` instead.

With the starter's values (`"Tandem"`, 3 hours, wind 18) the program prints:

```text
boat: tandem, 20 an hour
water: open sea
to pay: 60
```

A canoe for 6 hours in a wind of 20 prints:

```text
boat: canoe, 25 an hour
water: sheltered bay only
to pay: 100
```

and `"raft"` for 2 hours in a wind of 40 prints:

```text
boat: unknown "raft"
water: closed
to pay: nothing, no hire
```
