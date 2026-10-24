import (
	"context"
	"database/sql"
	"database/sql/driver"
	"errors"
	"time"
)

// outWhat lists what the fake database was asked to do, in order.
func outWhat(log []shedEntry) []string {
	var what []string
	for _, e := range log {
		what = append(what, e.what)
	}
	return what
}

func Test(t *testing.T) {
	ctx := t.Context()
	at := time.Date(2026, 8, 15, 14, 5, 0, 0, time.UTC)

	// A successful checkout.
	fake := newShed(shedTable(shedSample()))
	db := sql.OpenDB(fake)
	defer db.Close()
	check.NoError(checkOut(ctx, db, 4, "cy", at), "checkOut of a boat that is in the shed")
	log := fake.entries()
	check.Equal(outWhat(log), []string{"begin", "exec", "exec", "commit"},
		"what a successful checkOut asks the database to do, in order")
	check.Equal(log[1].query, markBoatOut, "the first statement of checkOut is markBoatOut")
	check.Equal(log[1].args, []driver.Value{"cy", int64(4)}, "the arguments of markBoatOut: the member, then the boat id")
	check.Equal(log[2].query, insertLoan, "the second statement of checkOut is insertLoan")
	check.Equal(log[2].args, []driver.Value{int64(4), "cy", at}, "the arguments of insertLoan: boat id, member, time")
	check.True(log[1].inTx && log[2].inTx, "both statements run inside the transaction")
	check.True(log[1].conn == log[0].conn && log[2].conn == log[0].conn,
		"both statements run on the transaction's connection (through tx, not db)")
	check.Equal(db.Stats().InUse, 0, "connections still in use after a successful checkOut")

	// The boat is already out: the UPDATE changes no row.
	err := checkOut(ctx, db, 4, "dee", at)
	check.ErrorIs(err, ErrBoatUnavailable, "checkOut of a boat that is already out")
	check.Equal(err.Error(), "boat 4: boat is out or does not exist", "the error text for a boat that is out")
	log = fake.entries()[4:]
	check.Equal(outWhat(log), []string{"begin", "exec", "rollback"},
		"what checkOut asks the database to do when the boat is out (no loan, no commit)")
	check.Equal(db.Stats().InUse, 0, "connections still in use after checkOut of a boat that is out")

	err = checkOut(ctx, db, 77, "dee", at)
	check.ErrorIs(err, ErrBoatUnavailable, "checkOut of a boat that does not exist")

	// The loan cannot be recorded: the boat must not stay marked out.
	full := errors.New("database or disk is full")
	failing := newShed(func(query string, args []driver.Value) shedReply {
		if query == insertLoan {
			return shedReply{err: full}
		}
		return shedTable(shedSample())(query, args)
	})
	failingDB := sql.OpenDB(failing)
	defer failingDB.Close()
	err = checkOut(ctx, failingDB, 1, "eli", at)
	check.ErrorIs(err, full, "checkOut returns the error of a failing insertLoan, wrapped with %w")
	check.Equal(outWhat(failing.entries()), []string{"begin", "exec", "exec", "rollback"},
		"what checkOut asks the database to do when insertLoan fails (roll back, no commit)")

	// The first statement fails.
	locked := errors.New("database is locked")
	lockedDB := sql.OpenDB(newShed(func(string, []driver.Value) shedReply { return shedReply{err: locked} }))
	defer lockedDB.Close()
	check.ErrorIs(checkOut(ctx, lockedDB, 1, "eli", at), locked, "checkOut returns the error of a failing markBoatOut")
	check.Equal(lockedDB.Stats().InUse, 0, "connections still in use after markBoatOut failed")

	cancelled, cancel := context.WithCancel(ctx)
	cancel()
	quiet := newShed(shedTable(shedSample()))
	quietDB := sql.OpenDB(quiet)
	defer quietDB.Close()
	err = checkOut(cancelled, quietDB, 1, "eli", at)
	check.ErrorIs(err, context.Canceled, "checkOut with a cancelled context (is the context passed to BeginTx?)")
	check.Equal(len(quiet.entries()), 0, "the number of statements run with a cancelled context")
}
