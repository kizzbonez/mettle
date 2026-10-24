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

	kestrel, err := findBoat(ctx, db, 1)
	check.NoError(err, "findBoat of a boat that exists")
	check.Equal(kestrel, Boat{ID: 1, Name: "Kestrel", Kind: "kayak", Seats: 1, Notes: "new spray deck"},
		"findBoat of a boat with notes")
	puffin, err := findBoat(ctx, db, 3)
	check.NoError(err, "findBoat of a boat whose notes are NULL")
	check.Equal(puffin.Notes, "", "the notes of a boat whose notes column is NULL")
	check.Equal(puffin.Name, "Puffin", "the name of a boat whose notes column is NULL")

	queries := fake.entries()
	check.True(len(queries) == 2, "findBoat sends exactly one query per call")
	check.Equal(queries[0].query, selectBoat, "the SQL that findBoat sends is the selectBoat constant")
	check.Equal(queries[0].args, []driver.Value{int64(1)}, "findBoat passes the id as the query's only argument")

	missing, err := findBoat(ctx, db, 42)
	check.ErrorIs(err, ErrBoatNotFound, "findBoat of a boat that does not exist")
	check.Equal(err.Error(), "boat 42: boat not found", "the error text for a boat that does not exist")
	check.Equal(missing, Boat{}, "the Boat returned with the not-found error is the zero Boat")

	diskErr := errors.New("disk I/O error")
	broken := newShed(func(string, []driver.Value) shedReply { return shedReply{err: diskErr} })
	brokenDB := sql.OpenDB(broken)
	defer brokenDB.Close()
	_, err = findBoat(ctx, brokenDB, 1)
	check.ErrorIs(err, diskErr, "findBoat returns a failing query's error, wrapped with %w")
	check.True(!errors.Is(err, ErrBoatNotFound), "a failing query is not reported as a missing boat")

	cancelled, cancel := context.WithCancel(ctx)
	cancel()
	_, err = findBoat(cancelled, db, 1)
	check.ErrorIs(err, context.Canceled, "findBoat with a cancelled context (is the context passed to the query?)")
}
