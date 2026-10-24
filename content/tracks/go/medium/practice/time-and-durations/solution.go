package main

import (
	"fmt"
	"strconv"
	"strings"
	"time"
)

// Session is one session on the velodrome track.
type Session struct {
	Name   string
	Start  time.Time
	Length time.Duration
}

// sessionLayout is the layout of a session's date and time of day.
const sessionLayout = "2006-01-02 15:04"

// parseSession reads a line such as "2026-12-19 18:30 90 taster": the date,
// the local time it starts in loc, its length in minutes and a one-word name.
func parseSession(line string, loc *time.Location) (Session, error) {
	fields := strings.Fields(line)
	if len(fields) != 4 {
		return Session{}, fmt.Errorf("session %q: want 4 fields, found %d", line, len(fields))
	}
	start, err := time.ParseInLocation(sessionLayout, fields[0]+" "+fields[1], loc)
	if err != nil {
		return Session{}, fmt.Errorf("session %q: %w", line, err)
	}
	minutes, err := strconv.Atoi(fields[2])
	if err != nil || minutes <= 0 {
		return Session{}, fmt.Errorf("session %q: length %q is not a positive number of minutes", line, fields[2])
	}
	return Session{Name: fields[3], Start: start, Length: time.Duration(minutes) * time.Minute}, nil
}

// End returns the moment the session finishes: Length of elapsed time after
// Start, whatever the clocks on the wall do in between.
func (s Session) End() time.Time {
	return s.Start.Add(s.Length)
}

// Status describes the session at the moment now. Durations are rounded
// down to whole minutes. A session is on from its start up to, but not
// including, its end.
func (s Session) Status(now time.Time) string {
	switch {
	case now.Before(s.Start):
		return "starts in " + s.Start.Sub(now).Truncate(time.Minute).String()
	case now.Before(s.End()):
		return "on now, " + s.End().Sub(now).Truncate(time.Minute).String() + " left"
	default:
		return "finished"
	}
}

// BoardLine formats the session for the screen with its times shown in loc,
// such as "Sat 19 Dec 18:30-20:00 taster".
func (s Session) BoardLine(loc *time.Location) string {
	start := s.Start.In(loc)
	end := s.End().In(loc)
	return start.Format("Mon 2 Jan 15:04") + "-" + end.Format("15:04") + " " + s.Name
}
