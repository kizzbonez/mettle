Write the four functions of `solution.py` with `groupby` and `value_counts`: no loop over the films
(a hidden test has tens of thousands of them). `screenings` is a DataFrame with one row per
screening and the columns `film` (`str`), `screen` (`int64`), `day` (`str`), `tickets`
(`int64`), `takings` (`float64`) and `rating` (`float64`, NaN when nobody rated it). The sample is
`data/screenings.csv`. No function changes `screenings`.

1. `takings_by_film(screenings)` returns a Series of the total takings per film, indexed by film
   (index named `film`, Series named `takings`), highest first; films with equal takings in film
   order, A to Z.
2. `film_report(screenings)` returns one row per film with these columns, in this order:

   | column | dtype | meaning |
   | --- | --- | --- |
   | `film` | `str` | the film |
   | `screenings` | `int64` | number of screenings (rows) |
   | `tickets` | `int64` | total tickets |
   | `avg_rating` | `float64` | mean of the ratings given, rounded to 2 decimals; NaN if none |
   | `rated` | `int64` | number of screenings with a rating |

   Sorted by `tickets`, most first, equal tickets by `film` A to Z, and numbered from 0. An empty
   input gives an empty frame with the five columns.
3. `per_screen_day(screenings)` returns one row per screen and day that has a screening, with the
   columns `screen`, `day` and `avg_tickets` (the mean of `tickets`, rounded to 1 decimal),
   sorted by screen and then by day name A to Z (the order `groupby` gives), numbered from 0.
4. `screenings_per_day(screenings)` returns a Series of the number of screenings per day, most
   first; days with equal counts in the order they first appear in `screenings`.

Example:

```python
screenings = pd.read_csv("data/screenings.csv")
print(takings_by_film(screenings))
print(film_report(screenings))
print(per_screen_day(screenings))
screenings_per_day(screenings).to_dict()     # {'Sun': 4, 'Fri': 3, 'Sat': 3}
```

```text
film
Moon Garden      2880.0
Rocket Dog       2232.0
Night Ferry      1570.0
Quiet Harbour     360.0
Name: takings, dtype: float64
            film  screenings  tickets  avg_rating  rated
0    Moon Garden           3      288        4.30      2
1     Rocket Dog           3      279        4.55      2
2    Night Ferry           2      157        4.00      2
3  Quiet Harbour           2       40        4.80      1
   screen  day  avg_tickets
0       1  Fri         41.0
1       1  Sat        120.0
2       1  Sun         82.5
3       2  Fri         88.0
4       2  Sat         96.0
5       2  Sun         58.5
```

**Tips.** Group keys come out sorted A to Z, so a **stable** sort by value keeps tied films in
that order. `size` counts rows and `count` counts values present. Named aggregation,
`agg(name=("column", "function"))`, with `as_index=False` builds the report in one call.
`value_counts` sorts by count and keeps ties in the order of first appearance.
