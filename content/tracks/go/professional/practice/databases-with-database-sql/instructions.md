Complete the three functions in `solution.go`. The starter declares the `Boat` type, two
sentinel errors and the club's SQL as constants: send those constants exactly as they are, and
pass every value as an argument for a `?` placeholder, never inside the SQL text. Use the
`Context` methods of `database/sql` with the `ctx` you are given.

The tests run your code against a fake database, a small driver written in the visible test.
It answers like a real one and keeps a log of everything it was asked to do, so the tests can
see which SQL you sent, with which arguments, and whether it ran inside a transaction.

1. **`findBoat(ctx context.Context, db *sql.DB, id int64) (Boat, error)`** runs `selectBoat`
   with `QueryRowContext` and scans the five columns into a `Boat`.
   - The `notes` column may be NULL: scan it into a `sql.NullString` (or `sql.Null[string]`)
     and store `""` in `Notes` for NULL.
   - When there is no such boat, return the zero `Boat` and an error that wraps
     `ErrBoatNotFound` with `%w`, with exactly this text: `boat 42: boat not found`.
   - Any other error is returned wrapped with `%w` and some context of your choice. It must not
     look like a missing boat.
2. **`boatsOfKind(ctx context.Context, db *sql.DB, kind string) ([]Boat, error)`** runs
   `selectBoatsOfKind` with `QueryContext` and returns the boats in the order the rows arrive.
   - No boats of that kind is not an error: return an empty (or nil) slice and `nil`.
   - Close the rows on every path, including when a row cannot be scanned, and check
     `rows.Err()` after the loop. Return any error wrapped with `%w`.
3. **`checkOut(ctx context.Context, db *sql.DB, boatID int64, member string, at time.Time) error`**
   lends a boat in one transaction started with `BeginTx`:
   - run `markBoatOut` with the arguments `member, boatID`. If it changed no row
     (`RowsAffected` is 0), the boat is out or does not exist: return an error wrapping
     `ErrBoatUnavailable` with exactly this text: `boat 4: boat is out or does not exist`;
   - otherwise run `insertLoan` with `boatID, member, at`, then commit;
   - every statement goes through the transaction, and on any error the transaction is rolled
     back (a deferred `tx.Rollback()` does this) and the error returned, wrapped with `%w`.

```go
heron, err := findBoat(ctx, db, 2)
// Boat{ID: 2, Name: "Heron", Kind: "canoe", Seats: 2, Notes: ""}, nil

_, err = findBoat(ctx, db, 9)
// errors.Is(err, ErrBoatNotFound) is true; err.Error() is "boat 9: boat not found"

kayaks, err := boatsOfKind(ctx, db, "kayak")
// Kestrel, Osprey and Puffin, in that order (the query sorts by name)

err = checkOut(ctx, db, 1, "ada", at) // nil: BEGIN, UPDATE, INSERT, COMMIT
err = checkOut(ctx, db, 1, "bo", at)  // wraps ErrBoatUnavailable: BEGIN, UPDATE, ROLLBACK
```

**Tip.** `*sql.Row` and `*sql.Rows` both have the method `Scan(dest ...any) error`, so one
small helper that takes an interface with that method can scan a boat for both functions.
