---
title: Security in Go
summary: Avoid the mistakes that turn into security holes. Make secrets with crypto/rand, compare them in constant time, sign messages with HMAC, store passwords with a slow hash, let html/template escape output, keep file access inside a directory with os.Root, limit input sizes, and keep TLS, logs and dependencies safe.
minutes: 40
objectives:
  - Generate tokens with crypto/rand and compare secrets with hmac.Equal or subtle.ConstantTimeCompare
  - Sign and verify a message with HMAC-SHA256, and explain why passwords need a slow, salted hash
  - Prevent injection and path traversal with html/template, placeholders and os.Root
  - Limit request sizes, keep secrets out of logs, and check dependencies with govulncheck
---

## Outline

1. Random values for secrets
2. Comparing secrets in constant time
3. Signing messages with HMAC
4. Storing passwords
5. Escaping output: html/template
6. Staying inside a directory: os.Root
7. Limiting what you accept
8. TLS, GODEBUG, logs and govulncheck

## Random values for secrets

A reset link, a session ID or an API key is only as safe as it is hard to guess. Package
**crypto/rand** reads the operating system's secure random source. Since Go 1.24,
`rand.Text()` returns a ready-made token of at least 128 random bits in base32, and
`rand.Read(b)` fills a byte slice and never returns an error.

```go
fmt.Println(rand.Text())
fmt.Println(rand.Text())

r := mrand.New(mrand.NewPCG(2026, 10)) // math/rand/v2
fmt.Println(r.Uint64(), r.Uint64())
r = mrand.New(mrand.NewPCG(2026, 10))
fmt.Println(r.Uint64(), r.Uint64())
```

```text
CD7DCHU6WSAKOEF5J5VN7MZBSQ
QJ3AMIYVSTWSZ6RZRW6WBB7FOQ
7859148847597287868 1414975350040465319
7859148847597287868 1414975350040465319
```

**math/rand/v2** is a fast generator for simulations, shuffles and jitter. The same seed gives
the same numbers, so anyone who learns or guesses the seed, or recovers a weak generator's
state from its outputs, can predict the rest. Never use it for anything that must stay secret.

## Comparing secrets in constant time

`token == want` stops at the first byte that differs, so a guess whose first bytes are right
takes slightly longer to reject. Over many requests an attacker can measure that and recover a secret one
byte at a time: a **timing attack**. `subtle.ConstantTimeCompare(a, b)` from **crypto/subtle**
takes the same time whatever the contents (it returns 1 for equal), and `hmac.Equal` does the
same for MACs. Only the length may leak, which is fine for fixed-length tokens.

## Signing messages with HMAC

A payment provider calls your webhook. How do you know the request is really from it? Both
sides share a key, the sender computes an **HMAC** (a keyed hash) of the body and sends it in a
header, and you recompute it:

```go
func sign(key, body []byte) string {
	mac := hmac.New(sha256.New, key)
	mac.Write(body)
	return hex.EncodeToString(mac.Sum(nil))
}

func validSignature(key, body []byte, signature string) bool {
	got, err := hex.DecodeString(signature)
	if err != nil {
		return false
	}
	mac := hmac.New(sha256.New, key)
	mac.Write(body)
	return hmac.Equal(got, mac.Sum(nil))
}
```

Signing a body, then checking it, a tampered body (45000 instead of 4500) and a wrong key:

```text
6a6a0546d316f9fd8db5a72ea5157c26b35e205bbf4107dd08b57c3096597ec7
true
false
false
```

Without the key nobody can make a valid signature, and one changed byte changes it entirely.
Decode the hex and compare bytes, so that upper- and lower-case hex are treated alike.

## Storing passwords

Never store a password, and never store a fast hash of it: a GPU computes billions of SHA-256
hashes per second, so a leaked table of them falls quickly. Use a **key derivation function**
that is deliberately slow and takes a random **salt**, so equal passwords get different hashes.
The usual choices are bcrypt and argon2id from `golang.org/x/crypto` (not available in this
sandbox). The standard library has had `crypto/pbkdf2` since Go 1.24:

```go
const iterations = 600_000

func hashPassword(password string) (salt, hash []byte, err error) {
	salt = make([]byte, 16)
	rand.Read(salt)
	hash, err = pbkdf2.Key(sha256.New, password, salt, iterations, 32)
	return salt, hash, err
}

func checkPassword(password string, salt, hash []byte) (bool, error) {
	again, err := pbkdf2.Key(sha256.New, password, salt, iterations, 32)
	if err != nil {
		return false, err
	}
	return hmac.Equal(again, hash), nil
}
```

Hashing the same password twice, then checking it and a variant with a capital C:

```text
16 32 false
true <nil>
false <nil>
```

The two hashes differ because the salts do. Store the salt and the iteration count next to the
hash, and raise the count as hardware gets faster.

## Escaping output: html/template

A page built with **text/template** pastes values in as they are. **html/template** has the
same API but escapes each value for the place it lands: HTML text, an attribute, a URL, a
script:

```go
const page = `<p>Hello, {{.}}!</p><a href="/search?q={{.}}">again</a>` + "\n"
name := `<script>alert("hi")</script>`

texttemplate.Must(texttemplate.New("t").Parse(page)).Execute(os.Stdout, name)
htmltemplate.Must(htmltemplate.New("h").Parse(page)).Execute(os.Stdout, name)
```

```text
<p>Hello, <script>alert("hi")</script>!</p><a href="/search?q=<script>alert("hi")</script>">again</a>
<p>Hello, &lt;script&gt;alert(&#34;hi&#34;)&lt;/script&gt;!</p><a href="/search?q=%3cscript%3ealert%28%22hi%22%29%3c%2fscript%3e">again</a>
```

The first line runs the visitor's script in every reader's browser: **cross-site scripting**.
The second shows it as text, and URL-encodes it inside the link. Trust the templates, never the
data, and do not wrap user input in `template.HTML`, which switches escaping off. The same rule
gave you placeholders in lesson 06: data travels separately from code.

## Staying inside a directory: os.Root

A handler serves `name` from an uploads folder. `filepath.Join(dir, name)` with
`name = "../../etc/passwd"` walks out of it: **path traversal**. A symbolic link inside the
folder can do the same. An **`os.Root`** (Go 1.24) refuses any path that leaves its directory:

```go
root, err := os.OpenRoot(dir) // dir has march.pdf, and sneaky.pdf -> /etc/passwd
if err != nil {
	log.Fatal(err)
}
defer root.Close()
for _, name := range []string{"march.pdf", "../../etc/passwd", "sneaky.pdf"} {
	_, joinErr := os.ReadFile(filepath.Join(dir, name))
	_, rootErr := root.ReadFile(name)
	fmt.Printf("%s\n  Join: %v\n  Root: %v\n", name, joinErr, rootErr)
}
```

```text
march.pdf
  Join: <nil>
  Root: <nil>
../../etc/passwd
  Join: <nil>
  Root: openat ../../etc/passwd: path escapes from parent
sneaky.pdf
  Join: <nil>
  Root: openat sneaky.pdf: path escapes from parent
```

`Join` happily read the password file twice. Go 1.25 gave `Root` `ReadFile`, `WriteFile`,
`MkdirAll` and more; `os.OpenInRoot(dir, name)` opens one file. `filepath.IsLocal(name)` is a
quick check of the text alone, without following links.

## Limiting what you accept

Every input is hostile until checked. Cap the size before you read: in a handler,
`r.Body = http.MaxBytesReader(w, r.Body, 1<<20)` makes reads past 1 MiB fail; elsewhere use
`io.LimitReader`. Then validate the content: types, ranges, lengths, allowed values. Reject
what is wrong with a clear error rather than trying to repair it.

## TLS, GODEBUG, logs and govulncheck

- **TLS.** `crypto/tls` defaults are safe: TLS 1.2 minimum, and post-quantum hybrid key
  exchange (X25519MLKEM768 since 1.24, SecP256r1MLKEM768 and SecP384r1MLKEM1024 since 1.26).
  Do not set `InsecureSkipVerify` outside tests.
- **GODEBUG** settings switch individual behaviours back for compatibility: the environment
  (`GODEBUG=tlsmlkem=0`), a `godebug tlsmlkem=0` line in `go.mod`, or `//go:debug` above
  `package main`. The defaults follow the `go` line in `go.mod`. Treat each one as debt.
- **Logs.** Never log passwords, tokens, keys or whole `Authorization` headers. Redact with a
  `ReplaceAttr` or a `LogValuer` (lesson 04), and keep secrets out of flags, which `ps` shows.
- **govulncheck** (`golang.org/x/vuln/cmd/govulncheck`) checks your module against the Go
  vulnerability database and reports only the vulnerable functions your code really calls. Run
  `govulncheck ./...` in CI, and update to the latest Go point release, which carries security
  fixes.

## Common mistakes

- **`math/rand` for tokens.** Predictable, as the seeded run above shows. Use `rand.Text()`.
- **`==` or `bytes.Equal` on a secret.** Use `hmac.Equal` or `subtle.ConstantTimeCompare`.
- **SHA-256 of a password.** Fast hashes are for checksums. Use bcrypt, argon2id or PBKDF2.
- **Checking a path with `strings.HasPrefix` after `Join`.** A symbolic link passes the check
  and leads out. Open through an `os.Root`.

## Practice

1. Make a 256-bit key as hex.
2. Write `sameToken(got, want string) bool` in constant time.
3. Make a handler refuse bodies over 1 MiB with status 413.

### Answers

```go
func newKey() string {
	key := make([]byte, 32)
	rand.Read(key) // never returns an error since Go 1.24
	return hex.EncodeToString(key)
}

func sameToken(got, want string) bool {
	return subtle.ConstantTimeCompare([]byte(got), []byte(want)) == 1
}

func upload(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, 1<<20)
	if _, err := io.ReadAll(r.Body); err != nil {
		http.Error(w, err.Error(), http.StatusRequestEntityTooLarge)
		return
	}
	fmt.Fprintln(w, "ok")
}
```

The key's length, two token comparisons, and a 2 MiB upload through `httptest`:

```text
64
true false
413 http: request body too large
```

## Key takeaways

- Secrets come from `crypto/rand` (`rand.Text`, `rand.Read`), never from `math/rand`.
- Compare secrets with `hmac.Equal` or `subtle.ConstantTimeCompare`.
- HMAC-SHA256 proves who sent a message; passwords need a slow, salted hash.
- html/template, placeholders and `os.Root` keep data from becoming code or paths.
- Limit sizes first, validate always, log no secrets, run govulncheck.

## Further reading

- [Security best practices for Go developers](https://go.dev/doc/security/best-practices)
- [Traversal-resistant file APIs (Go blog)](https://go.dev/blog/osroot)
- [Package html/template](https://pkg.go.dev/html/template)
- [Package crypto/hmac](https://pkg.go.dev/crypto/hmac)
