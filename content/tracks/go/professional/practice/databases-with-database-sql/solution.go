package main

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"
)

// Boat is one boat in the club's shed.
type Boat struct {
	ID    int64
	Name  string
	Kind  string // "kayak", "canoe" or "paddleboard"
	Seats int
	Notes string // "" when the notes column is NULL
}

// Errors that callers can test for with errors.Is.
var (
	ErrBoatNotFound    = errors.New("boat not found")
	ErrBoatUnavailable = errors.New("boat is out or does not exist")
)

// The club's SQL. The database is SQLite, so the placeholders are ?.
const (
	selectBoat        = "SELECT id, name, kind, seats, notes FROM boats WHERE id = ?"
	selectBoatsOfKind = "SELECT id, name, kind, seats, notes FROM boats WHERE kind = ? ORDER BY name"
	markBoatOut       = "UPDATE boats SET out_with = ? WHERE id = ? AND out_with IS NULL"
	insertLoan        = "INSERT INTO loans (boat_id, member, taken_at) VALUES (?, ?, ?)"
)

// rowScanner is the method that *sql.Row and *sql.Rows have in common, so
// that scanBoat serves both queries.
type rowScanner interface {
	Scan(dest ...any) error
}

// scanBoat reads the five columns of selectBoat or selectBoatsOfKind.
func scanBoat(row rowScanner) (Boat, error) {
	var b Boat
	var notes sql.NullString
	if err := row.Scan(&b.ID, &b.Name, &b.Kind, &b.Seats, &notes); err != nil {
		return Boat{}, err
	}
	b.Notes = notes.String // "" when NULL
	return b, nil
}

// findBoat returns the boat with the given id, or an error wrapping
// ErrBoatNotFound when there is none.
func findBoat(ctx context.Context, db *sql.DB, id int64) (Boat, error) {
	b, err := scanBoat(db.QueryRowContext(ctx, selectBoat, id))
	if errors.Is(err, sql.ErrNoRows) {
		return Boat{}, fmt.Errorf("boat %d: %w", id, ErrBoatNotFound)
	}
	if err != nil {
		return Boat{}, fmt.Errorf("find boat %d: %w", id, err)
	}
	return b, nil
}

// boatsOfKind returns every boat of one kind, in the order of the query.
func boatsOfKind(ctx context.Context, db *sql.DB, kind string) ([]Boat, error) {
	rows, err := db.QueryContext(ctx, selectBoatsOfKind, kind)
	if err != nil {
		return nil, fmt.Errorf("list %s boats: %w", kind, err)
	}
	defer rows.Close() // releases the connection on every return

	var boats []Boat
	for rows.Next() {
		b, err := scanBoat(rows)
		if err != nil {
			return nil, fmt.Errorf("list %s boats: %w", kind, err)
		}
		boats = append(boats, b)
	}
	// Next also stops on a failure, which only Err reports.
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("list %s boats: %w", kind, err)
	}
	return boats, nil
}

// checkOut lends a boat to a member: it marks the boat out and records the
// loan in one transaction, so that either both happen or neither does.
func checkOut(ctx context.Context, db *sql.DB, boatID int64, member string, at time.Time) error {
	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("check out boat %d: %w", boatID, err)
	}
	defer tx.Rollback() // a no-op once Commit has succeeded

	res, err := tx.ExecContext(ctx, markBoatOut, member, boatID)
	if err != nil {
		return fmt.Errorf("check out boat %d: %w", boatID, err)
	}
	n, err := res.RowsAffected()
	if err != nil {
		return fmt.Errorf("check out boat %d: %w", boatID, err)
	}
	if n == 0 {
		return fmt.Errorf("boat %d: %w", boatID, ErrBoatUnavailable)
	}
	if _, err := tx.ExecContext(ctx, insertLoan, boatID, member, at); err != nil {
		return fmt.Errorf("check out boat %d: %w", boatID, err)
	}
	if err := tx.Commit(); err != nil {
		return fmt.Errorf("check out boat %d: %w", boatID, err)
	}
	return nil
}
