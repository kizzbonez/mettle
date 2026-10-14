The Riverside Food Co-op is forty households that buy dry goods together. Once a month they
pool their orders for oats, rice, lentils, coffee and olive oil, buy in bulk from a wholesaler,
and split the delivery on a Saturday morning in the community hall. Each household then pays
for what it ordered plus a small handling fee, a percentage agreed at the annual meeting, that
covers the van and the hall.

Members type their orders into a shared spreadsheet that the treasurer exports as
`orders.csv`. The wholesaler's price list for the month arrives as `prices.json`:

```text
member,item,quantity
Ana,oats-5kg,2
Ben,coffee-1kg,1
Chloe,olive-oil-1l,2
```

Until now the treasurer, Malik, ran a script a former volunteer left behind. It added prices as
floating-point numbers, so a fee of 0.825 came out as 0.82 one month and 0.83 the next. It
crashed with a traceback when someone typed `two` instead of `2`, and printed its complaints
into the same output Malik pasted into the invoices. When it failed, it still exited with
status 0, so the scheduled job that emails the invoices sent empty ones.

You are writing its replacement: a small command-line program, `coop`, with two subcommands.
`totals` prints one CSV line per household for the treasurer's spreadsheet; `invoice` prints
one household's bill. It calculates money with `Decimal`, skips bad lines with a clear warning
on standard error, and exits with a status the scheduler can trust.
