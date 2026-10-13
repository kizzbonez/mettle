Harborline Supply runs a warehouse with forty loading docks. At the end of every shift each
handheld scanner uploads a plain-text ledger: one stock movement per line.

```text
# dock 7, evening shift
KB-204, IN, 40
KB-204, OUT, 12

CBL-9, IN, 300
```

The importer that reads these files calls `unwrap()` on every field. Last night a scanner with a
failing battery wrote `KB-204, OUT, 1 2`. The import job panicked, nothing was loaded, and the
morning shift started work with yesterday's stock counts.

You are replacing the parser. It must never panic on bad input. When a line is wrong, the dock
supervisor needs to know which line it was and what was wrong with it, so they can correct the
upload and send it again.
