import (
	"slices"
	"time"
)

type parcelItem struct {
	town  string
	grams int
}

func novemberDay(day int) time.Time {
	return time.Date(2026, time.November, day, 0, 0, 0, 0, time.UTC)
}

func ergFor(min, sec, tenths int) ErgTime {
	return ErgTime(time.Duration(min)*time.Minute + time.Duration(sec)*time.Second + time.Duration(tenths)*100*time.Millisecond)
}

func Test(t *testing.T) {
	parcels := []parcelItem{{"Leeds", 300}, {"York", 900}, {"Leeds", 700}, {"York", 900}, {"Hull", 50}, {"Leeds", 200}}
	heaviest := BestBy(parcels, func(p parcelItem) string { return p.town }, func(a, b parcelItem) bool { return a.grams > b.grams })
	check.Equal(heaviest, map[string]parcelItem{"Leeds": {"Leeds", 700}, "York": {"York", 900}, "Hull": {"Hull", 50}}, "BestBy keeps the best item per key for any types")

	words := []string{"kayak", "oar", "row", "scull", "eight", "cox"}
	byLength := BestBy(words, func(w string) int { return len(w) }, func(a, b string) bool { return a < b })
	check.Equal(byLength, map[int]string{5: "eight", 3: "cox"}, "BestBy with int keys keeps the item better() prefers")
	firstWins := BestBy(words, func(w string) int { return len(w) }, func(a, b string) bool { return false })
	check.Equal(firstWins, map[int]string{5: "kayak", 3: "oar"}, "BestBy keeps the first item when none is better")
	check.Equal(len(BestBy([]int(nil), func(n int) int { return n }, func(a, b int) bool { return a < b })), 0, "BestBy of no items is an empty map")

	results := []Result{
		{Member: "zoe", Date: novemberDay(9), Time: ergFor(7, 10, 0)},
		{Member: "max", Date: novemberDay(2), Time: ergFor(6, 50, 5)},
		{Member: "ivy", Date: novemberDay(9), Time: ergFor(7, 10, 0)},
		{Member: "zoe", Date: novemberDay(2), Time: ergFor(7, 10, 0)},
		{Member: "Max", Date: novemberDay(3), Time: ergFor(7, 30, 0)},
		{Member: "kim", Date: novemberDay(4), Time: ergFor(7, 10, 0)},
		{Member: "max", Date: novemberDay(16), Time: ergFor(6, 51, 0)},
		{Member: "ivy", Date: novemberDay(16), Time: ergFor(7, 25, 0)},
		{Member: "lou", Date: novemberDay(16), Time: ergFor(8, 0, 0)},
	}
	before := slices.Clone(results)
	entries := Standings(results)
	check.Equal(entries, []Entry{
		{Rank: 1, Member: "max", Best: ergFor(6, 50, 5), Date: novemberDay(2), Attempts: 2},
		{Rank: 2, Member: "ivy", Best: ergFor(7, 10, 0), Date: novemberDay(9), Attempts: 2},
		{Rank: 2, Member: "kim", Best: ergFor(7, 10, 0), Date: novemberDay(4), Attempts: 1},
		{Rank: 2, Member: "zoe", Best: ergFor(7, 10, 0), Date: novemberDay(2), Attempts: 2},
		{Rank: 5, Member: "Max", Best: ergFor(7, 30, 0), Date: novemberDay(3), Attempts: 1},
		{Rank: 6, Member: "lou", Best: ergFor(8, 0, 0), Date: novemberDay(16), Attempts: 1},
	}, "standings: best time per member, ties by name share a rank, then ranks skip, names compared exactly")
	check.Equal(results, before, "Standings does not change the results it is given")
	check.Equal(len(Standings(nil)), 0, "Standings of no results is empty")

	attempts := []Result{
		{Member: "ivy", Date: novemberDay(16), Time: ergFor(7, 25, 0)},
		{Member: "max", Date: novemberDay(2), Time: ergFor(6, 50, 5)},
		{Member: "ivy", Date: novemberDay(2), Time: ergFor(7, 40, 0)},
		{Member: "ivy", Date: novemberDay(9), Time: ergFor(7, 10, 0)},
		{Member: "ivy", Date: novemberDay(2), Time: ergFor(7, 35, 0)},
	}
	beforeAttempts := slices.Clone(attempts)
	var got []ErgTime
	for r := range Attempts(attempts, "ivy") {
		got = append(got, r.Time)
	}
	check.Equal(got, []ErgTime{ergFor(7, 40, 0), ergFor(7, 35, 0), ergFor(7, 10, 0), ergFor(7, 25, 0)}, "Attempts yields earliest first, same-day results in their original order")
	check.Equal(attempts, beforeAttempts, "Attempts does not change the results it is given")

	calls := 0
	for range Attempts(attempts, "ivy") {
		calls++
		if calls == 2 {
			break
		}
	}
	check.Equal(calls, 2, "a loop over Attempts can stop early without a panic")
	check.Equal(len(slices.Collect(Attempts(attempts, "nobody"))), 0, "Attempts of an unknown member yields nothing")
	check.Equal(len(slices.Collect(Attempts(attempts, "IVY"))), 0, "Attempts compares names exactly")
}
