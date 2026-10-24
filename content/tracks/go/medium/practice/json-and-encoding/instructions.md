Complete `solution.go`. Use `encoding/json` (the v1 API from the lesson) and `encoding/csv`.

1. **Struct tags.** Add tags to `Dish` and `Menu` so that they marshal exactly like this:
   - `Name` as `name`, `PriceCents` as `price_cents`, `Heat` as `heat`;
   - `Vegan` as `vegan`, left out when it is `false`;
   - `Allergens` as `allergens`, left out when there are none;
   - `Recipe` never written to JSON or read from it: it stays in the kitchen;
   - `Menu.Truck` as `truck` and `Menu.Dishes` as `dishes`.
2. **`Heat`** is written in JSON as its name: `"mild"`, `"hot"` or `"fiery"`.
   - `(h Heat) MarshalJSON() ([]byte, error)` returns the name as a JSON string, and an error for
     any other value, such as `Heat(7)`;
   - `(h *Heat) UnmarshalJSON(data []byte) error` reads a JSON string with one of the three names
     and sets `*h`; any other name gives an error that quotes it, `unknown heat "volcanic"`, and
     a value that is not a JSON string (such as `2`) is an error too.
3. **`readMenu(r io.Reader) (Menu, error)`** decodes one menu from `r` with a `json.Decoder`:
   - a member that `Menu` or `Dish` does not have is an error (the owner mistypes field names);
   - then check the dishes in order and return an error for the first one that has an empty
     name, `dish 2: name is missing`, or a price that is not above 0,
     `dish 3: price_cents must be positive` (dishes are numbered from 1);
   - on any error, return the zero `Menu` and the error.
4. **`writePriceList(w io.Writer, m Menu) error`** writes the price list as CSV with a
   `csv.Writer`: a header row `dish,price`, then one row per dish in menu order, with the price
   written with two decimals (450 cents is `4.50`, 5 cents is `0.05`). Let `csv.Writer` quote
   names that need it. Return any error, including the one `Error()` reports after `Flush`.

Example:

```go
menu, err := readMenu(strings.NewReader(`{
  "truck": "Saltmarsh",
  "dishes": [
    {"name": "Bean chilli", "price_cents": 750, "heat": "hot", "vegan": true, "allergens": []},
    {"name": "Fish, chips and peas", "price_cents": 995, "heat": "mild", "allergens": ["fish", "gluten"]}
  ]
}`))
// err == nil; menu.Dishes[0].Heat == Hot, menu.Dishes[1].Allergens == []string{"fish", "gluten"}

data, err := json.Marshal(menu.Dishes[0])
// {"name":"Bean chilli","price_cents":750,"heat":"hot","vegan":true}

err = writePriceList(os.Stdout, menu)
```

```text
dish,price
Bean chilli,7.50
"Fish, chips and peas",9.95
```

```go
_, err = readMenu(strings.NewReader(`{"truck": "Saltmarsh", "dishs": []}`))
// err != nil: the menu has no member "dishs"
```
