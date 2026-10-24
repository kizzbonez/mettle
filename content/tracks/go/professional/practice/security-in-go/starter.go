package main

import (
	"errors"
	"io"
)

// maxScoreBytes is the largest score file the portal will send.
const maxScoreBytes = 64 << 10

// Errors that callers can test for with errors.Is.
var (
	ErrNotScore = errors.New("not a score file")
	ErrTooLarge = errors.New("score file too large")
)

// welcomePage is the member's start page. Name and Part come from the member.
const welcomePage = `<h1>Welcome, {{.Name}}!</h1>
<p><a href="/scores?part={{.Part}}">Scores for {{.Part}}</a></p>
`

// Task 1: newResetToken returns a password-reset token that nobody can guess.
func newResetToken() string {
	panic("not implemented")
}

// Task 2: validSignature reports whether header ("sha256=<hex>") is the
// HMAC-SHA256 of body under key, compared in constant time.
func validSignature(key, body []byte, header string) bool {
	panic("not implemented")
}

// Task 3: readScore returns the contents of the score file name inside dir.
func readScore(dir, name string) ([]byte, error) {
	panic("not implemented")
}

// Task 4: renderWelcome writes the welcome page for a member, escaping their data.
func renderWelcome(w io.Writer, name, part string) error {
	panic("not implemented")
}
