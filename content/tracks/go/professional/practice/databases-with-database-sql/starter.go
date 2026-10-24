package main

import (
	"context"
	"database/sql"
	"errors"
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
// Use these constants exactly as they are.
const (
	selectBoat        = "SELECT id, name, kind, seats, notes FROM boats WHERE id = ?"
	selectBoatsOfKind = "SELECT id, name, kind, seats, notes FROM boats WHERE kind = ? ORDER BY name"
	markBoatOut       = "UPDATE boats SET out_with = ? WHERE id = ? AND out_with IS NULL"
	insertLoan        = "INSERT INTO loans (boat_id, member, taken_at) VALUES (?, ?, ?)"
)

// Task 1: findBoat returns the boat with the given id, or an error wrapping
// ErrBoatNotFound when there is none.
func findBoat(ctx context.Context, db *sql.DB, id int64) (Boat, error) {
	panic("not implemented")
}

// Task 2: boatsOfKind returns every boat of one kind, in the order of the query.
func boatsOfKind(ctx context.Context, db *sql.DB, kind string) ([]Boat, error) {
	panic("not implemented")
}

// Task 3: checkOut marks a boat out and records the loan in one transaction.
func checkOut(ctx context.Context, db *sql.DB, boatID int64, member string, at time.Time) error {
	panic("not implemented")
}
