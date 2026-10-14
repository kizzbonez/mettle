Complete `solution.sh`. It is run as `bash solution.sh CHAIN MIN_MS`, where `CHAIN` is the
output of `systemd-analyze critical-chain` and `MIN_MS` a number of milliseconds. It lists the
units on the chain that took at least `MIN_MS` to start.

1. Only lines that contain ` +` (a space, then `+`) count: they are units with a start-up time.
   Skip every other line, including the two explanations at the top and the units shown with
   only an `@` time.
2. The unit name is the first word on the line once the tree drawing (`└─` and the spaces before
   it) is removed. Keep the name exactly as written: names can contain `@`, `\` and `-`.
3. The start-up time is everything after ` +` up to the end of the line. It has one or more parts
   separated by spaces, each a number followed by `min`, `s` or `ms`: `180ms`, `6.012s`, `3s`,
   `1min 28.081s`. Convert it to whole milliseconds (rounded).
4. Print `MS ms UNIT` for every unit whose time is **at least** `MIN_MS`, slowest first. Units
   with the same time keep their order in the chain. Print nothing if there are none.

Example: `bash solution.sh data/critical-chain.txt 200` prints

```text
88081 ms NetworkManager-wait-online.service
2291 ms kiosk-browser.service
305 ms NetworkManager.service
215 ms systemd-timesyncd.service
```

The kiosk waits almost a minute and a half for the network to be "online", although the
browser needs only 2.3 seconds itself.

**Tips:** in `awk`, `index($0, " +")` finds where the time starts and `substr` takes it;
`split` cuts it into parts. Test for `ms` before you test for `s`. `sort -s -k1,1nr` sorts by the
first field as a number, largest first, and keeps the order of equal ones.
