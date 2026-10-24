Complete the three functions in `solution.go`. This week's pages are in the file
`data/visitors.txt`.

1. **`countCountries(r io.Reader) (map[string]int, error)`** reads the visitor book from `r` with
   a `bufio.Scanner` and counts the visitors from each country:
   - each line holds one country, written as the visitor wrote it (`Wales` and `wales` are
     different keys); remove spaces around it;
   - skip blank lines and lines that start with `#`, after removing spaces;
   - when reading fails, return the error (wrapping it with `%w` is fine).
2. **`writeSummary(w io.Writer, counts map[string]int) error`** writes one line per country,
   `"<country> <count>\n"`, the country with the most visitors first; countries with the same
   count go in alphabetical order. An empty map writes nothing. Stop at the first write that
   fails and return its error.
3. **`summarise(inPath, outPath string) (err error)`** puts the two together:
   - open `inPath` with `os.Open`, close it with `defer`, and count its countries; if it cannot
     be opened, return the error **before** creating anything;
   - create `outPath`'s folder and any missing parents with `os.MkdirAll` (`filepath.Dir` gives
     the folder);
   - create the output file with `os.Create`, which replaces an existing file, and write the
     summary through a `bufio.Writer`;
   - return the error from `Flush` and the error from closing the output file, so that a summary
     that was not fully saved is never reported as a success.

Example, with `data/visitors.txt`:

```text
# Point Ellen lighthouse visitor book, week 28
Portugal
Wales
  Japan  

Wales
# rain all afternoon
Portugal
New Zealand
Wales
Japan
```

```go
err := summarise("data/visitors.txt", "reports/week-28.txt")
// err is nil, the folder reports/ now exists, and reports/week-28.txt holds:
```

```text
Wales 3
Japan 2
Portugal 2
New Zealand 1
```

```go
err = summarise("data/missing.txt", "reports/missing.txt")
// errors.Is(err, fs.ErrNotExist) is true, and reports/missing.txt was not created
```
