package main

import (
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"html/template"
	"io"
	"os"
	"strings"
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

var welcome = template.Must(template.New("welcome").Parse(welcomePage))

// newResetToken returns a password-reset token that nobody can guess.
func newResetToken() string {
	return rand.Text()
}

// validSignature reports whether header ("sha256=<hex>") is the HMAC-SHA256
// of body under key. It compares in constant time.
func validSignature(key, body []byte, header string) bool {
	hexMAC, ok := strings.CutPrefix(header, "sha256=")
	if !ok {
		return false
	}
	got, err := hex.DecodeString(hexMAC)
	if err != nil {
		return false
	}
	mac := hmac.New(sha256.New, key)
	mac.Write(body)
	return hmac.Equal(got, mac.Sum(nil))
}

// readScore returns the contents of the score file name inside dir. It never
// leaves dir, whatever name contains, and refuses files over maxScoreBytes.
func readScore(dir, name string) ([]byte, error) {
	if !strings.HasSuffix(name, ".pdf") {
		return nil, fmt.Errorf("%q: %w", name, ErrNotScore)
	}
	f, err := os.OpenInRoot(dir, name)
	if err != nil {
		return nil, err
	}
	defer f.Close()
	// Read one byte more than allowed, to tell "exactly the limit" from "over it".
	data, err := io.ReadAll(io.LimitReader(f, maxScoreBytes+1))
	if err != nil {
		return nil, err
	}
	if len(data) > maxScoreBytes {
		return nil, fmt.Errorf("%q: %w", name, ErrTooLarge)
	}
	return data, nil
}

// renderWelcome writes the welcome page for a member, escaping their data.
func renderWelcome(w io.Writer, name, part string) error {
	return welcome.Execute(w, struct{ Name, Part string }{name, part})
}
