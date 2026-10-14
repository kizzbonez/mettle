Write `solution.sh`. It is run as `bash solution.sh FILE`, and the starter already stores the
file name in the variable `file`. The name may contain spaces.

1. `FILE` is a fuel log in CSV. Its first line is the header `van,date,litres,km`. Every other
   line with exactly **four** comma-separated fields is a **record**: the van, the date, the
   litres filled (at most one decimal) and the kilometres driven since the last fill (a whole
   number). Skip every other line, such as empty lines and notes.
2. For each van, print `VAN LITRES KM`: its litres added up, with exactly one decimal place, and
   its kilometres added up, as a whole number. Order these lines by van name, as `sort` orders
   them.
3. Then print `fleet LITRES KM`, the same totals over all records.
4. Then print `longest VAN KM`: the single record with the most kilometres. If several records
   share the most, take the first of them in the file.

The log always has at least one record. For the sample file (`bash solution.sh data/fuel.csv`)
the output is:

```text
VAN-1 80.5 1000
VAN-2 78.5 915
VAN-3 12.5 140
fleet 171.5 2055
longest VAN-1 520
```

**Tips.**
- Which pattern selects "not the header, and exactly four fields"? Use it in front of every rule
  that adds something up.
- `for (van in ...)` visits the vans in no particular order; pipe the per-van lines through
  `sort`, and print the last two lines with a second awk command.
- A rule such as `$4 > most { most = $4 }` remembers the largest value seen so far.
