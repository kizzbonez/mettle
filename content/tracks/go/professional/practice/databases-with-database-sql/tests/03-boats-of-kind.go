import (
	"context"
	"database/sql"
	"database/sql/driver"
	"errors"
)

func Test(t *testing.T) {
	fake := newShed(shedTable(shedSample()))
	db := sql.OpenDB(fake)
	defer db.Close()
	ctx := t.Context()

	canoes, err := boatsOfKind(ctx, db, "canoe")
	check.NoError(err, "boatsOfKind for a kind with one boat")
	check.Equal(canoes, []Boat{{ID: 2, Name: "Heron", Kind: "canoe", Seats: 2}}, "boatsOfKind for a kind with one boat")

	boards, err := boatsOfKind(ctx, db, "paddleboard")
	check.NoError(err, "boatsOfKind for a kind with no boats")
	check.Equal(len(boards), 0, "the number of boats of a kind the club does not have")

	sneaky := "kayak' OR '1'='1"
	none, err := boatsOfKind(ctx, db, sneaky)
	check.NoError(err, "boatsOfKind for a kind that contains quotes")
	check.Equal(len(none), 0, "a kind containing SQL is matched as text, not run as SQL")
	last := fake.entries()[len(fake.entries())-1]
	check.Equal(last.query, selectBoatsOfKind, "the SQL that boatsOfKind sends is the selectBoatsOfKind constant")
	check.Equal(last.args, []driver.Value{sneaky}, "boatsOfKind passes the kind as the query's only argument")

	// The connection drops after two rows.
	reset := errors.New("connection reset by peer")
	dropping := newShed(func(query string, args []driver.Value) shedReply {
		r := shedTable(shedSample())(query, args)
		r.rows = r.rows[:2]
		r.rowsErr = reset
		return r
	})
	droppingDB := sql.OpenDB(dropping)
	defer droppingDB.Close()
	_, err = boatsOfKind(ctx, droppingDB, "kayak")
	check.ErrorIs(err, reset, "boatsOfKind reports a failure that ends the rows early")

	// The second row has NULL seats, which cannot be scanned into an int.
	badRow := newShed(func(query string, args []driver.Value) shedReply {
		return shedReply{columns: shedColumns, rows: [][]driver.Value{
			{int64(1), "Kestrel", "kayak", int64(1), nil},
			{int64(5), "Grebe", "kayak", nil, nil},
			{int64(6), "Tern", "kayak", int64(1), nil},
		}}
	})
	badDB := sql.OpenDB(badRow)
	defer badDB.Close()
	_, err = boatsOfKind(ctx, badDB, "kayak")
	check.Error(err, "boatsOfKind returns an error when a row cannot be scanned")
	check.Equal(badDB.Stats().InUse, 0, "connections still in use after a row could not be scanned (are the rows closed?)")

	cancelled, cancel := context.WithCancel(ctx)
	cancel()
	_, err = boatsOfKind(cancelled, db, "kayak")
	check.ErrorIs(err, context.Canceled, "boatsOfKind with a cancelled context (is the context passed to the query?)")
}
