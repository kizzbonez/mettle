Complete the function and the three methods in `solution.go`. Keep the `Session` type and the
`sessionLayout` constant. None of your code may call `time.Now()`: the moment to judge by is
always passed in, so that the tests can choose it.

1. **`parseSession(line string, loc *time.Location) (Session, error)`** reads a line of four
   fields separated by spaces: the date, the time of day it starts, its length in minutes and a
   one-word name, such as `2026-12-19 18:30 90 taster`.
   - The date and time are local time in `loc` (the velodrome's zone), in the layout
     `sessionLayout` (`"2006-01-02 15:04"`): use `time.ParseInLocation`. If they do not parse,
     return an error that wraps the parse error with `%w`.
   - The length must be a whole number of minutes above 0; turn it into a `time.Duration`.
   - Any other number of fields is an error too. On an error, return the zero `Session`.
2. **`(s Session) End() time.Time`** returns the moment the session finishes: `Length` after
   `Start`.
3. **`(s Session) Status(now time.Time) string`** describes the session at the moment `now`,
   with durations rounded **down** to whole minutes and written by `Duration.String`:
   - before the start: `"starts in 45m0s"`;
   - from the start (included) up to the end (not included): `"on now, 1h5m0s left"`;
   - from the end on: `"finished"`.

   Compare instants with `Before`, `After` or `Equal`, never with `==`: `now` may be in another
   zone than `Start`.
4. **`(s Session) BoardLine(loc *time.Location) string`** returns the line for the screen, with
   both times shown in `loc`: the day as `Mon 2 Jan 15:04`, a hyphen, the end time as `15:04`,
   a space and the name, such as `Sat 19 Dec 18:30-20:00 taster`.

Example (`oslo` is `time.LoadLocation("Europe/Oslo")`):

```go
taster, err := parseSession("2026-12-19 18:30 90 taster", oslo)
// err == nil; taster.Start is 18:30 in Oslo, which is 17:30 UTC, and taster.Length is 1h30m0s
taster.End()                 // 2026-12-19 20:00 in Oslo
taster.BoardLine(oslo)       // "Sat 19 Dec 18:30-20:00 taster"
taster.BoardLine(time.UTC)   // "Sat 19 Dec 17:30-19:00 taster"

now := time.Date(2026, time.December, 19, 17, 45, 30, 0, oslo)
taster.Status(now)                         // "starts in 44m0s" (44 minutes 30 seconds, rounded down)
taster.Status(taster.Start)                // "on now, 1h30m0s left"
taster.Status(taster.End())                // "finished"

_, err = parseSession("2026-12-19 18:30 ninety taster", oslo)   // err != nil
```
