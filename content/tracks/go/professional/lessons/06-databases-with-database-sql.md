---
title: Databases with database/sql
summary: Use SQL databases through database/sql. Open and ping a connection pool, query one row or many and scan them, handle NULL and sql.ErrNoRows, pass values as placeholders, write inside transactions, and keep the SQL behind a repository.
minutes: 40
objectives:
  - Open a *sql.DB with a driver, check it with PingContext and size its connection pool
  - Query one row and many rows with a context, closing rows and checking rows.Err and sql.ErrNoRows
  - Pass values as placeholders instead of building SQL strings, and scan nullable columns
  - Write a transaction with BeginTx, a deferred Rollback and Commit, behind a repository type
---

## Outline

1. database/sql and drivers
2. Opening a pool and checking it
3. One row: QueryRowContext and sql.ErrNoRows
4. Many rows: Next, Scan, Close and Err
5. Placeholders, never string building
6. NULL columns
7. Writing and transactions
8. Prepared statements and the repository pattern

## database/sql and drivers

Package **database/sql** is the standard library's interface to SQL databases. It knows no
particular database: a **driver** package for PostgreSQL, SQLite or MySQL plugs into it. You
import the driver for its side effect, with the blank identifier; its `init` registers it:

```go
import (
	"database/sql"

	_ "github.com/jackc/pgx/v5/stdlib" // registers the driver "pgx"
)
```

Other common drivers are `modernc.org/sqlite` (pure Go, driver name `"sqlite"`) and
`github.com/go-sql-driver/mysql`. Your code uses only `database/sql` types, so switching
databases mostly means changing the import, the driver name and the SQL dialect.

The sandbox has no database or third-party modules, so the pgx lines are for your own machine.
The other examples run against a small stand-in driver, `"memdb"`, that answers the lesson's
queries from memory; what they print is real `database/sql` behaviour.

## Opening a pool and checking it

```go
db, err := sql.Open("pgx", os.Getenv("DATABASE_URL"))
if err != nil {
	return nil, err
}
db.SetMaxOpenConns(20)
db.SetMaxIdleConns(20)
db.SetConnMaxIdleTime(5 * time.Minute)

ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
defer cancel()
if err := db.PingContext(ctx); err != nil {
	db.Close()
	return nil, fmt.Errorf("database unreachable: %w", err)
}
```

`sql.Open` only checks its arguments and may not connect at all, so a wrong password would
surface at the first query. `PingContext` at start-up fails fast instead (lesson 05).

A `*sql.DB` is not one connection but a **connection pool**, safe for concurrent use: it
opens connections when needed and reuses idle ones. Open it once in `main`, pass it to what
needs it, close it at shutdown. By default there is no limit on open connections and two idle
ones are kept. `SetMaxOpenConns` protects the database from bursts, but then a query waits for
a free connection, so one leaked connection can stall the program (see Common mistakes).
`SetConnMaxLifetime` recycles connections, which helps behind load balancers.

## One row: QueryRowContext and sql.ErrNoRows

```go
var ErrNotFound = errors.New("not found")

func boatName(ctx context.Context, db *sql.DB, id int64) (string, error) {
	var name string
	err := db.QueryRowContext(ctx, "SELECT name FROM boats WHERE id = ?", id).Scan(&name)
	if errors.Is(err, sql.ErrNoRows) {
		return "", fmt.Errorf("boat %d: %w", id, ErrNotFound)
	}
	if err != nil {
		return "", fmt.Errorf("boat %d: %w", id, err)
	}
	return name, nil
}
```

The raw error for the missing boat 9, then `boatName` for boats 1 and 9:

```text
raw: sql: no rows in result set, ErrNoRows: true
"Kestrel" <nil> false
"" boat 9: not found true
```

`QueryRowContext` keeps any error until `Scan`, which returns **`sql.ErrNoRows`** when no
row matches. Translate it into your own sentinel here, so callers never import `database/sql`
to ask "was it missing?". Use the `Context` methods, so a cancelled request also stops its query.

## Many rows: Next, Scan, Close and Err

```go
func boatsOfKind(ctx context.Context, db *sql.DB, kind string) ([]Boat, error) {
	rows, err := db.QueryContext(ctx,
		"SELECT id, name, notes FROM boats WHERE kind = ? ORDER BY name", kind)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var boats []Boat
	for rows.Next() {
		var b Boat
		if err := rows.Scan(&b.ID, &b.Name, &b.Notes); err != nil {
			return nil, err
		}
		boats = append(boats, b)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return boats, nil
}
```

```text
[] sql: Scan error on column index 2, name "notes": converting NULL to string is unsupported
```

Learn this shape. `defer rows.Close()` follows the error check, because open rows hold a
connection. `Next` returns false at the end and on a failure, so `rows.Err()` tells them
apart; without it, a connection lost halfway looks like a short, successful result. `Scan`
takes one pointer per column and converts each value. Here the data broke it: Puffin's notes
column is NULL.

## Placeholders, never string building

```go
name := "x' OR '1'='1"
query := fmt.Sprintf("SELECT id FROM members WHERE name = '%s'", name)
fmt.Println(query)
```

```text
SELECT id FROM members WHERE name = 'x' OR '1'='1'
```

The input has become SQL and matches every member: **SQL injection**. Pass values as arguments,
`db.QueryContext(ctx, "SELECT id FROM members WHERE name = ?", name)`, and the driver sends
them apart from the SQL text, where they cannot change the statement. The placeholder is `?`
for SQLite and MySQL, `$1`, `$2` for PostgreSQL. Placeholders hold values only; a sort column
must come from a fixed list in your code.

## NULL columns

SQL's NULL has no Go `string` or `int` to land in. Scan into a type that can say "no value":

```go
var notes sql.NullString
if err := rows.Scan(&b.ID, &b.Name, &notes); err != nil {
	return nil, err
}
b.Notes = notes.String // "" when the column is NULL
```

```text
[{ID:1 Name:Kestrel Notes:new spray deck} {ID:3 Name:Puffin Notes:}] <nil>
```

`sql.NullString` has `String` and `Valid`; the generic `sql.Null[T]` has `V` and `Valid`;
a `*string` is nil for NULL. Use `""` when "no notes" and "empty notes" mean the same;
otherwise keep the `Null` or pointer in your struct.

## Writing and transactions

`ExecContext` runs a statement without rows and returns a `sql.Result` with `RowsAffected`
and `LastInsertId` (pgx has no `LastInsertId`: use `INSERT ... RETURNING id` with
`QueryRowContext`). A **transaction** makes several statements succeed or fail together:

```go
tx, err := db.BeginTx(ctx, nil)
if err != nil {
	return err
}
defer tx.Rollback() // does nothing once Commit has succeeded

res, err := tx.ExecContext(ctx,
	"UPDATE boats SET out_with = ? WHERE id = ? AND out_with IS NULL", member, boatID)
if err != nil {
	return fmt.Errorf("mark boat %d out: %w", boatID, err)
}
n, err := res.RowsAffected()
if err != nil {
	return err
}
if n == 0 {
	return fmt.Errorf("boat %d: %w", boatID, ErrUnavailable)
}
_, err = tx.ExecContext(ctx,
	"INSERT INTO loans (boat_id, member) VALUES (?, ?)", boatID, member)
if err != nil {
	return fmt.Errorf("record loan of boat %d: %w", boatID, err)
}
return tx.Commit()
```

The stand-in driver prints what it receives; boat 3 is already out:

```text
check out boat 1
  driver: BEGIN
  driver: UPDATE [bo 1]
  driver: INSERT [1 bo]
  driver: COMMIT
  result: <nil>
check out boat 3
  driver: BEGIN
  driver: UPDATE [bo 3]
  driver: ROLLBACK
  result: boat 3: boat is out or does not exist
```

`BeginTx` reserves one connection, so every statement inside goes through `tx`. The
deferred `Rollback` covers every early return; after `Commit` it just returns
`sql.ErrTxDone`, so the first trace has no ROLLBACK. `out_with IS NULL` plus
`RowsAffected` checks and claims the boat in one statement, so two members cannot both take it.

## Prepared statements and the repository pattern

For a statement run many times, `tx.PrepareContext(ctx, query)` returns a `*sql.Stmt`
parsed once; `defer stmt.Close()` and call `stmt.ExecContext(ctx, args...)`.

Keep all SQL in one **repository** type, such as `type BoatStore struct{ db *sql.DB }` with the
functions above as methods. Handlers depend on a small interface defined where they use it
(Advanced 10), and their tests use an in-memory fake. Test the repository against a real
database (in a container in CI) or a fake driver, as this lesson's lab does. Go 1.27's
`sql.ConvertAssign` exposes `Scan`'s conversions to drivers implementing the new
`driver.RowsColumnScanner`; application code keeps calling `Scan`.

## Common mistakes

- **Returning before the rows are closed.** With `SetMaxOpenConns(1)`, a function that reads
  one row and returns keeps the connection; the next query waits until its context expires:

  ```text
  in use: 1
  context deadline exceeded
  ```

  Put `defer rows.Close()` right after the `QueryContext` error check.
- **Forgetting the driver import.** `sql.Open("pgx", ...)` then fails with
  `sql: unknown driver "pgx" (forgotten import?)`.
- **Comparing with `==` after wrapping.** `err == sql.ErrNoRows` is false once a layer has
  wrapped the error. Use `errors.Is`.
- **Using `db` inside a transaction.** `db.ExecContext` runs outside it, on another
  connection; with a small pool it can wait forever for the one `tx` holds.

## Practice

1. Rewrite `"SELECT id FROM boats WHERE name = '" + name + "'"` safely for SQLite, then for
   PostgreSQL.
2. Write `kindCount(ctx, db, kind) (int, error)` with `SELECT COUNT(*) FROM boats WHERE kind = ?`.
3. Loop over the kayaks scanning notes into `sql.Null[string]`, and print `(no notes)` for NULL.

### Answers

```go
// 1. SQLite: "SELECT id FROM boats WHERE name = ?", name
//    PostgreSQL: "SELECT id FROM boats WHERE name = $1", name

func kindCount(ctx context.Context, db *sql.DB, kind string) (int, error) {
	var n int
	err := db.QueryRowContext(ctx, "SELECT COUNT(*) FROM boats WHERE kind = ?", kind).Scan(&n)
	return n, err
}

// 3. inside the rows.Next loop:
var notes sql.Null[string]
if err := rows.Scan(&id, &name, &notes); err != nil {
	return err
}
if !notes.Valid {
	notes.V = "(no notes)"
}
fmt.Printf("%d %s: %s\n", id, name, notes.V)
```

Counts for kayaks and rafts, then the loop:

```text
2 <nil>
0 <nil>
1 Kestrel: new spray deck
3 Puffin: (no notes)
```

## Key takeaways

- One `*sql.DB` pool per program, pinged at start-up; the driver is a blank import.
- `sql.ErrNoRows` comes from `Scan`; translate it into your own error.
- Many rows: `defer rows.Close()`, `Next`, `Scan`, then `rows.Err()`.
- Values go in placeholders, never into the SQL text; NULL goes into `Null` types or pointers.
- `BeginTx`, `defer tx.Rollback()`, everything on `tx`, then `Commit`.

## Further reading

- [database/sql package documentation](https://pkg.go.dev/database/sql)
- [Accessing relational databases (go.dev guide)](https://go.dev/doc/database/)
- [Executing transactions](https://go.dev/doc/database/execute-transactions)
