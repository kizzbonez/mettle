---
title: Time and Durations
summary: Work with instants and durations in package time, compare times correctly, format and parse with Go's reference time, handle time zones and daylight saving, round times, and pass the current time in so that code stays testable.
minutes: 35
objectives:
  - Build times with time.Date, do arithmetic with Add, Sub and AddDate, and use time.Duration and its constants
  - Compare times with Before, After and Equal, and explain why == is the wrong tool
  - Format and parse times with layouts written in the reference time and the predefined constants
  - Convert between time zones with LoadLocation, In and FixedZone, and write functions that take the current time as a parameter
---

## Outline

1. Instants and durations
2. Comparing times
3. Formatting and parsing with the reference time
4. Time zones and daylight saving
5. Truncate and Round
6. The clock: Now, Since, Sleep and testable code

## Instants and durations

Package `time` has two central types. A **`time.Time`** is an instant: a date and a time of day, down to the nanosecond, with a **location** (a time zone) for display. A **`time.Duration`** is a length of time, stored as an `int64` count of nanoseconds, with the constants `time.Nanosecond` up to `time.Hour` for writing it:

```go
func main() {
	start := time.Date(2026, time.October, 24, 9, 30, 0, 0, time.UTC)
	end := start.Add(90 * time.Minute)
	fmt.Println(start)
	fmt.Println(end, end.Sub(start), end.Weekday())
	fmt.Println(start.AddDate(0, 1, 8).Format(time.DateOnly))

	shift := 7*time.Hour + 45*time.Minute
	fmt.Println(shift, shift.Hours(), shift.Minutes())
	fmt.Println(time.Duration(1500) * time.Millisecond)
	fmt.Println(start.Add(-shift).Before(start), end.After(start))
}
```

```text
2026-10-24 09:30:00 +0000 UTC
2026-10-24 11:00:00 +0000 UTC 1h30m0s Saturday
2026-12-02
7h45m0s 7.75 465
1.5s
true true
```

`time.Date(year, month, day, hour, min, sec, nsec, loc)` builds an instant; months are constants such as `time.October`. `t.Add(d)` moves by a duration and `t.Sub(u)` returns the duration between two instants. `AddDate(years, months, days)` moves by calendar units. A `Duration` prints as `1h30m0s`, and `Hours()` and `Minutes()` give it as a `float64`.

`90 * time.Minute` works because `90` is an untyped constant (Basic 03). A variable of type `int` does not convert itself:

```go
minutes := 45
fmt.Println(minutes * time.Minute)
```

```text
./main.go:10:14: invalid operation: minutes * time.Minute (mismatched types int and time.Duration)
```

Write `time.Duration(minutes) * time.Minute`: convert the count, then multiply by the unit.

## Comparing times

Compare instants with `t.Before(u)`, `t.After(u)` and `t.Equal(u)`. Do not use `==`: it compares the whole struct, including the location, so the same instant shown in two zones is not `==`:

```go
func main() {
	noon := time.Date(2026, time.October, 24, 12, 0, 0, 0, time.UTC)
	tokyo, err := time.LoadLocation("Asia/Tokyo")
	if err != nil {
		fmt.Println(err)
		return
	}
	there := noon.In(tokyo)
	fmt.Println(noon, there)
	fmt.Println(noon == there, noon.Equal(there))

	plus2 := time.FixedZone("UTC+2", 2*60*60)
	fmt.Println(noon.In(plus2).Format(time.RFC3339))
}
```

```text
2026-10-24 12:00:00 +0000 UTC 2026-10-24 21:00:00 +0900 JST
false true
2026-10-24T14:00:00+02:00
```

`t.In(loc)` shows the same instant in another zone; it never changes the instant. For the same reason, convert times with `t.UTC()` before you use them as map keys. The zero `Time` is 1 January of year 1, and `t.IsZero()` tests for it.

## Formatting and parsing with the reference time

Go has no `YYYY-MM-DD` codes. A **layout** is the **reference time**, Monday 2 January 2006 at 15:04:05 in zone MST (`-0700`), written the way you want your times to look. Each part has a fixed meaning: `2006` year, `01` or `Jan` month, `02` day, `15` hour (or `3` with `PM`), `04` minute, `05` second, `Mon` weekday. The memory aid is 1 2 3 4 5 6 7: month 1, day 2, hour 3 (15), minute 4, second 5, year 6, zone -7. Common layouts are constants: `time.RFC3339`, `time.DateTime`, `time.DateOnly` and `time.TimeOnly`.

```go
func main() {
	t := time.Date(2026, time.March, 7, 18, 5, 9, 0, time.UTC)
	fmt.Println(t.Format(time.RFC3339))
	fmt.Println(t.Format(time.DateTime), "|", t.Format(time.DateOnly), "|", t.Format(time.TimeOnly))
	fmt.Println(t.Format("Mon 2 Jan 2006, 3:04 PM"))
	fmt.Println(t.Format("02/01/2006"))

	d, err := time.Parse(time.DateOnly, "2026-11-05")
	fmt.Println(d, err)
	_, err = time.Parse(time.DateOnly, "05/11/2026")
	fmt.Println(err)
	_, err = time.Parse(time.DateOnly, "2026-02-30")
	fmt.Println(err)
}
```

```text
2026-03-07T18:05:09Z
2026-03-07 18:05:09 | 2026-03-07 | 18:05:09
Sat 7 Mar 2026, 6:05 PM
07/03/2026
2026-11-05 00:00:00 +0000 UTC <nil>
parsing time "05/11/2026" as "2006-01-02": cannot parse "05/11/2026" as "2006"
parsing time "2026-02-30": day out of range
```

`time.Parse(layout, text)` reads text written in that layout and checks the date is real. Text without a zone is taken as UTC. **RFC 3339** (`2026-03-07T18:05:09Z`) is the format to use in JSON, logs and APIs: it is unambiguous, and times written in UTC sort correctly as text.

## Time zones and daylight saving

`time.LoadLocation("Europe/Lisbon")` loads a zone from the IANA time zone database: from the system's files, from Go's own copy, or from the program itself if it imports `time/tzdata`. It returns an error such as `unknown time zone Europe/Atlantis` for a name it cannot find, which is what every name gives when a minimal container image has no zone data. `time.FixedZone(name, seconds)` makes a zone with a fixed offset and needs no data, which suits tests. `time.ParseInLocation` parses text that has no zone as local time in a given place.

Daylight saving makes "one day later" ambiguous. Lisbon moves its clocks back one hour on 25 October 2026 (`lisbon` comes from `time.LoadLocation("Europe/Lisbon")`):

```go
sat := time.Date(2026, time.October, 24, 12, 0, 0, 0, lisbon)
fmt.Println(sat)
fmt.Println(sat.Add(24 * time.Hour))
fmt.Println(sat.AddDate(0, 0, 1))
fmt.Println(sat.AddDate(0, 0, 1).Sub(sat))
```

```text
2026-10-24 12:00:00 +0100 WEST
2026-10-25 11:00:00 +0000 WET
2026-10-25 12:00:00 +0000 WET
25h0m0s
```

`Add(24 * time.Hour)` adds exactly 24 hours of elapsed time; `AddDate(0, 0, 1)` keeps the clock time and moves the calendar date, so that "day" lasts 25 hours. Store and compute in UTC, and convert to a zone only to show a time to a person.

## Truncate and Round

`t.Truncate(d)` rounds an instant down to a multiple of `d`, and `t.Round(d)` to the nearest; a `Duration` has the same two methods:

```go
t := time.Date(2026, time.March, 7, 18, 47, 31, 0, time.UTC)
fmt.Println(t.Truncate(time.Hour).Format(time.TimeOnly), t.Round(time.Hour).Format(time.TimeOnly))
fmt.Println(t.Truncate(15 * time.Minute).Format(time.TimeOnly))
d := 2*time.Hour + 17*time.Minute + 42*time.Second
fmt.Println(d.Round(time.Minute), d.Truncate(time.Hour), d.Round(time.Hour))
```

```text
18:00:00 19:00:00
18:45:00
2h18m0s 2h0m0s 2h0m0s
```

They work on the absolute time since the zero time, not on the clock face, so in a zone whose offset is not a whole number of hours `Truncate(time.Hour)` can give a time with minutes. For "midnight in Lisbon", build it with `time.Date` from the date's parts.

## The clock: Now, Since, Sleep and testable code

`time.Now()` reads the clock. `time.Since(start)` is `time.Now().Sub(start)` and `time.Until(deadline)` is `deadline.Sub(time.Now())`. `time.Sleep(d)` pauses the current goroutine for at least `d`; timers and tickers are Advanced 03.

A `Time` from `Now` also holds a **monotonic clock** reading, a counter that only moves forward. `Sub`, `Since` and comparisons use it, so a measured duration stays right even if the wall clock is changed meanwhile. It shows as `m=+0.000289222` when you print the time; `t.Round(0)` removes it.

Code that calls `time.Now()` inside gives a different answer every run, which makes it hard to test. **Take the current time as a parameter**, and let only `main` call `time.Now()`:

```go
// overdue reports whether a loan due at due is late at the moment now.
func overdue(due, now time.Time) bool {
	return now.After(due)
}

func main() {
	due := time.Date(2026, time.November, 1, 17, 0, 0, 0, time.UTC)
	fmt.Println(overdue(due, due.Add(-time.Minute)), overdue(due, due), overdue(due, due.Add(time.Minute)))
}
```

```text
false false true
```

A test now checks the exact boundary with fixed times, instead of waiting for the clock.

## Common mistakes

- **`==` on times.** It compares zones too; use `Equal`.
- **Swapping layout parts.** `t.Format("2006-02-01")` prints `2026-07-03` for 7 March. `go vet` warns: `2006-02-01 should be 2006-01-02`.
- **`hh:mm` habits.** `"YYYY-MM-DD"` is not a layout: Go prints it unchanged. `"03:04"` is a 12-hour clock; use `15:04`.
- **Multiplying an `int` by a `Duration`.** Convert first: `time.Duration(n) * time.Second`.
- **`time.Now()` deep inside a function.** Tests become slow or flaky. Pass the time in.

## Practice

1. How long is it from 22:40 on 31 December 2026 to 01:15 on 1 January 2027, in UTC?
2. Format that first instant as `31.12.2026 22:40`.
3. Parse `2026-06-15 08:30:00` as local time in `time.FixedZone("UTC-4", -4*60*60)` and print it in UTC.

### Answers

```go
func main() {
	from := time.Date(2026, time.December, 31, 22, 40, 0, 0, time.UTC)
	to := time.Date(2027, time.January, 1, 1, 15, 0, 0, time.UTC)
	fmt.Println(to.Sub(from))
	fmt.Println(from.Format("02.01.2006 15:04"))

	t, err := time.ParseInLocation(time.DateTime, "2026-06-15 08:30:00", time.FixedZone("UTC-4", -4*60*60))
	fmt.Println(t.UTC(), err)
}
```

```text
2h35m0s
31.12.2026 22:40
2026-06-15 12:30:00 +0000 UTC <nil>
```

## Key takeaways

- `time.Time` is an instant with a location; `time.Duration` is nanoseconds with unit constants.
- `Add`, `Sub` and `AddDate` do arithmetic; `Before`, `After` and `Equal` compare.
- Layouts are the reference time `2006-01-02 15:04:05`; prefer `time.RFC3339` for data.
- Load zones with `LoadLocation`, or use `FixedZone`; compute in UTC, display in a zone.
- Take `now time.Time` as a parameter so that tests control the clock.

## Further reading

- [Package time](https://pkg.go.dev/time)
- [Go by Example: Time Formatting / Parsing](https://gobyexample.com/time-formatting-parsing)
- [Go by Example: Time](https://gobyexample.com/time)
