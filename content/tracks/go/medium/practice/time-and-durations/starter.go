package main

import "time"

// Session is one session on the velodrome track.
type Session struct {
	Name   string
	Start  time.Time
	Length time.Duration
}

// sessionLayout is the layout of a session's date and time of day.
const sessionLayout = "2006-01-02 15:04"

// Task 1: parseSession reads a line such as "2026-12-19 18:30 90 taster".
func parseSession(line string, loc *time.Location) (Session, error) {
	panic("not implemented")
}

// Task 2: End returns the moment the session finishes.
func (s Session) End() time.Time {
	panic("not implemented")
}

// Task 3: Status describes the session at the moment now.
func (s Session) Status(now time.Time) string {
	panic("not implemented")
}

// Task 4: BoardLine formats the session for the screen, in loc.
func (s Session) BoardLine(loc *time.Location) string {
	panic("not implemented")
}
