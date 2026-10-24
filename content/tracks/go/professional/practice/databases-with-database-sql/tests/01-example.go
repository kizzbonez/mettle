import (
	"cmp"
	"context"
	"database/sql"
	"database/sql/driver"
	"fmt"
	"io"
	"slices"
	"sync"
	"time"
)

// The tests talk to a fake database: a small driver written against
// database/sql/driver. Each test decides what the database answers, and the
// fake keeps a log of everything database/sql sent it.

// shedReply is the fake database's answer to one query or statement.
type shedReply struct {
	columns  []string
	rows     [][]driver.Value
	affected int64 // for statements: the rows affected
	err      error // the query or statement itself fails
	rowsErr  error // the rows fail after the last row instead of ending
}

// shedEntry is one thing the fake database was asked to do.
type shedEntry struct {
	conn  int    // the connection, numbered from 1
	inTx  bool   // whether a transaction was open on that connection
	what  string // "query", "exec", "begin", "commit" or "rollback"
	query string
	args  []driver.Value
}

type shedDB struct {
	mu    sync.Mutex
	reply func(query string, args []driver.Value) shedReply
	log   []shedEntry
	conns int
}

func newShed(reply func(query string, args []driver.Value) shedReply) *shedDB {
	return &shedDB{reply: reply}
}

// entries returns a copy of the log.
func (s *shedDB) entries() []shedEntry {
	s.mu.Lock()
	defer s.mu.Unlock()
	return slices.Clone(s.log)
}

func (s *shedDB) record(e shedEntry) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.log = append(s.log, e)
}

// Connect and Driver make shedDB a driver.Connector for sql.OpenDB.
func (s *shedDB) Connect(context.Context) (driver.Conn, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.conns++
	return &shedConn{db: s, id: s.conns}, nil
}

func (s *shedDB) Driver() driver.Driver { return shedDriver{s} }

type shedDriver struct{ db *shedDB }

func (d shedDriver) Open(string) (driver.Conn, error) { return d.db.Connect(context.Background()) }

type shedConn struct {
	db   *shedDB
	id   int
	inTx bool
}

func (c *shedConn) Close() error { return nil }

func (c *shedConn) Begin() (driver.Tx, error) {
	c.db.record(shedEntry{conn: c.id, inTx: c.inTx, what: "begin"})
	c.inTx = true
	return shedTx{c}, nil
}

func (c *shedConn) Prepare(query string) (driver.Stmt, error) { return shedStmt{c, query}, nil }

func (c *shedConn) ask(what, query string, named []driver.NamedValue) shedReply {
	args := make([]driver.Value, len(named))
	for i, v := range named {
		args[i] = v.Value
	}
	c.db.record(shedEntry{conn: c.id, inTx: c.inTx, what: what, query: query, args: args})
	return c.db.reply(query, args)
}

func (c *shedConn) QueryContext(_ context.Context, query string, args []driver.NamedValue) (driver.Rows, error) {
	r := c.ask("query", query, args)
	if r.err != nil {
		return nil, r.err
	}
	return &shedRows{columns: r.columns, rows: r.rows, end: r.rowsErr}, nil
}

func (c *shedConn) ExecContext(_ context.Context, query string, args []driver.NamedValue) (driver.Result, error) {
	r := c.ask("exec", query, args)
	if r.err != nil {
		return nil, r.err
	}
	return driver.RowsAffected(r.affected), nil
}

type shedTx struct{ c *shedConn }

func (t shedTx) Commit() error {
	t.c.db.record(shedEntry{conn: t.c.id, inTx: true, what: "commit"})
	t.c.inTx = false
	return nil
}

func (t shedTx) Rollback() error {
	t.c.db.record(shedEntry{conn: t.c.id, inTx: true, what: "rollback"})
	t.c.inTx = false
	return nil
}

// shedStmt serves prepared statements by asking the connection.
type shedStmt struct {
	c     *shedConn
	query string
}

func (s shedStmt) Close() error  { return nil }
func (s shedStmt) NumInput() int { return -1 }

func (s shedStmt) Exec(args []driver.Value) (driver.Result, error) {
	return s.c.ExecContext(context.Background(), s.query, shedNamed(args))
}

func (s shedStmt) Query(args []driver.Value) (driver.Rows, error) {
	return s.c.QueryContext(context.Background(), s.query, shedNamed(args))
}

func shedNamed(args []driver.Value) []driver.NamedValue {
	named := make([]driver.NamedValue, len(args))
	for i, v := range args {
		named[i] = driver.NamedValue{Ordinal: i + 1, Value: v}
	}
	return named
}

type shedRows struct {
	columns []string
	rows    [][]driver.Value
	end     error
}

func (r *shedRows) Columns() []string { return r.columns }
func (r *shedRows) Close() error      { return nil }

func (r *shedRows) Next(dest []driver.Value) error {
	if len(r.rows) == 0 {
		if r.end != nil {
			return r.end
		}
		return io.EOF
	}
	copy(dest, r.rows[0])
	r.rows = r.rows[1:]
	return nil
}

var shedColumns = []string{"id", "name", "kind", "seats", "notes"}

// shedSample is the club's shed: id, name, kind, seats, notes (nil is NULL).
func shedSample() [][]driver.Value {
	return [][]driver.Value{
		{int64(1), "Kestrel", "kayak", int64(1), "new spray deck"},
		{int64(2), "Heron", "canoe", int64(2), nil},
		{int64(3), "Puffin", "kayak", int64(1), nil},
		{int64(4), "Osprey", "kayak", int64(2), "rudder sticks"},
	}
}

// shedTable answers the club's four SQL statements from a table of boats,
// the way a real database would.
func shedTable(boats [][]driver.Value) func(string, []driver.Value) shedReply {
	var mu sync.Mutex
	out := map[any]bool{}
	return func(query string, args []driver.Value) shedReply {
		mu.Lock()
		defer mu.Unlock()
		switch query {
		case selectBoat:
			r := shedReply{columns: shedColumns}
			for _, b := range boats {
				if b[0] == args[0] {
					r.rows = append(r.rows, b)
				}
			}
			return r
		case selectBoatsOfKind:
			r := shedReply{columns: shedColumns}
			for _, b := range boats {
				if b[2] == args[0] {
					r.rows = append(r.rows, b)
				}
			}
			slices.SortFunc(r.rows, func(a, b []driver.Value) int {
				return cmp.Compare(a[1].(string), b[1].(string))
			})
			return r
		case markBoatOut:
			for _, b := range boats {
				if b[0] == args[1] && !out[b[0]] {
					out[b[0]] = true
					return shedReply{affected: 1}
				}
			}
			return shedReply{affected: 0}
		case insertLoan:
			return shedReply{affected: 1}
		}
		return shedReply{err: fmt.Errorf("the fake database does not know the SQL %q", query)}
	}
}

func Test(t *testing.T) {
	fake := newShed(shedTable(shedSample()))
	db := sql.OpenDB(fake)
	defer db.Close()
	ctx := t.Context()

	heron, err := findBoat(ctx, db, 2)
	check.NoError(err, "findBoat(ctx, db, 2)")
	check.Equal(heron, Boat{ID: 2, Name: "Heron", Kind: "canoe", Seats: 2, Notes: ""},
		"findBoat(ctx, db, 2), a boat whose notes are NULL")

	_, err = findBoat(ctx, db, 9)
	check.ErrorIs(err, ErrBoatNotFound, "findBoat(ctx, db, 9), a boat that does not exist")

	kayaks, err := boatsOfKind(ctx, db, "kayak")
	check.NoError(err, `boatsOfKind(ctx, db, "kayak")`)
	check.Equal(kayaks, []Boat{
		{ID: 1, Name: "Kestrel", Kind: "kayak", Seats: 1, Notes: "new spray deck"},
		{ID: 4, Name: "Osprey", Kind: "kayak", Seats: 2, Notes: "rudder sticks"},
		{ID: 3, Name: "Puffin", Kind: "kayak", Seats: 1, Notes: ""},
	}, `boatsOfKind(ctx, db, "kayak")`)

	at := time.Date(2026, 7, 4, 9, 30, 0, 0, time.UTC)
	check.NoError(checkOut(ctx, db, 1, "ada", at), `checkOut(ctx, db, 1, "ada", at)`)
	check.ErrorIs(checkOut(ctx, db, 1, "bo", at), ErrBoatUnavailable,
		`checkOut(ctx, db, 1, "bo", at), when ada already has boat 1`)
}
