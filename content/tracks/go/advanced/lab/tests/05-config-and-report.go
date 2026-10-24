import (
	"context"
	"errors"
	"fmt"
	"sync/atomic"
	"testing/synctest"
	"time"
)

func Test(t *testing.T) {
	var calls atomic.Int64
	cat := CatalogueFunc(func(ctx context.Context, branch, isbn string) (int, error) {
		calls.Add(1)
		return 1, nil
	})
	good := Config{Workers: 2, Timeout: time.Second, Attempts: 2, Backoff: time.Second}
	bad := []struct {
		what string
		cfg  Config
	}{
		{"Workers 0", Config{0, time.Second, 2, time.Second}},
		{"Workers -1", Config{-1, time.Second, 2, time.Second}},
		{"Timeout 0", Config{2, 0, 2, time.Second}},
		{"a negative Timeout", Config{2, -time.Second, 2, time.Second}},
		{"Attempts 0", Config{2, time.Second, 0, time.Second}},
		{"a negative Backoff", Config{2, time.Second, 2, -time.Millisecond}},
	}
	for _, c := range bad {
		synctest.Test(t, func(t *testing.T) {
			results, err := StockCheck(context.Background(), cat, "isbn", []string{"A", "B"}, c.cfg, nil)
			check.ErrorIs(err, ErrConfig, "a Config with "+c.what+" is rejected with an error that is ErrConfig")
			check.True(results == nil, "no results for a Config with "+c.what)
		})
	}
	check.Equal(calls.Load(), int64(0), "no catalogue is called when the Config is rejected")

	synctest.Test(t, func(t *testing.T) {
		results, err := StockCheck(context.Background(), cat, "isbn", nil, good, nil)
		check.NoError(err, "StockCheck of no branches")
		check.Equal(len(results), 0, "StockCheck of no branches returns no results")
		zero := Config{Workers: 1, Timeout: time.Second, Attempts: 1, Backoff: 0}
		results, err = StockCheck(context.Background(), cat, "isbn", []string{"A"}, zero, nil)
		check.NoError(err, "a Config with Backoff 0 and Attempts 1 is valid")
		check.Equal(results, []Result{{Branch: "A", Copies: 1, Attempts: 1}}, "the result of one branch with the smallest valid Config")
	})

	errLost := errors.New("barcode reader lost")
	results := []Result{
		{Branch: "Central", Copies: 1, Attempts: 1},
		{Branch: "Docks", Copies: 12, Attempts: 3},
		{Branch: "Hillside", Copies: 0, Attempts: 2},
		{Branch: "Old Town", Attempts: 1, Err: fmt.Errorf("after 30s: %w", ErrNoAnswer)},
		{Branch: "Quayside", Attempts: 2, Err: ErrBusy},
		{Branch: "Riverside", Attempts: 1, Err: errLost},
	}
	check.Equal(Report(results), "Central: 1 copy (1 call)\n"+
		"Docks: 12 copies (3 calls)\n"+
		"Hillside: none on the shelf (2 calls)\n"+
		"Old Town: no answer (1 call)\n"+
		"Quayside: failed: catalogue busy (2 calls)\n"+
		"Riverside: failed: barcode reader lost (1 call)\n"+
		"2 of 6 branches have it, 13 copies in all\n", "Report of six branches: copies, none, no answer (wrapped) and failures")
	check.Equal(Report([]Result{{Branch: "Central", Copies: 1, Attempts: 1}}), "Central: 1 copy (1 call)\n1 of 1 branches have it, 1 copy in all\n",
		"Report of one branch with one copy")
	check.Equal(Report([]Result{{Branch: "Hillside", Attempts: 1}}), "Hillside: none on the shelf (1 call)\n0 of 1 branches have it, 0 copies in all\n",
		"Report of one branch with none")
	check.Equal(Report(nil), "0 of 0 branches have it, 0 copies in all\n", "Report of no results")
}
