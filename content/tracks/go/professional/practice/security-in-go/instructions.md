Complete the four functions in `solution.go`. The starter declares `maxScoreBytes`, two
sentinel errors and the page template `welcomePage`; keep them as they are.

1. **`newResetToken() string`** returns a password-reset token from `crypto/rand`'s `Text`
   function. A test makes `crypto/rand` predictable with `testing/cryptotest` and checks that
   your token is the one `rand.Text()` gives, so a token from `math/rand` or from the clock
   fails.
2. **`validSignature(key, body []byte, header string) bool`** checks the header the payment
   provider sends, `sha256=` followed by the hex HMAC-SHA256 of the body under `key`:
   - return false unless the header starts with exactly `sha256=` and the rest is valid hex
     (upper- or lower-case: decode it with `encoding/hex`);
   - compute the HMAC of `body` with `hmac.New(sha256.New, key)` and compare the bytes with
     `hmac.Equal`, never with `==`.
3. **`readScore(dir, name string) ([]byte, error)`** returns the contents of the file `name`
   inside the folder `dir`. `name` comes from the request, so:
   - if `name` does not end in `.pdf`, return an error wrapping `ErrNotScore` before opening
     anything;
   - open the file with `os.OpenInRoot(dir, name)` (or an `os.Root`), so that no name and no
     symbolic link can reach a file outside `dir`; names such as `christmas/carols.pdf`, and
     links that stay inside `dir`, are fine. Return the error it gives;
   - read at most `maxScoreBytes + 1` bytes (`io.LimitReader`). A file of exactly
     `maxScoreBytes` is fine; a longer one gives no data and an error wrapping `ErrTooLarge`.
4. **`renderWelcome(w io.Writer, name, part string) error`** writes `welcomePage` to `w` with
   `html/template`, giving it a value whose fields `Name` and `Part` hold `name` and `part`,
   and returns any error from executing it. Parse the template once, for example in a
   package-level `var` with `template.Must`.

```go
newResetToken() // "CD7DCHU6WSAKOEF5J5VN7MZBSQ": 26 characters of base32, different every time

key := []byte("subs-webhook-key-from-the-environment")
body := []byte(`{"member":"ada","paid":4500}`)
validSignature(key, body, "sha256="+hex.EncodeToString(mac)) // true, where mac is the HMAC of body
validSignature(key, body, "sha256=00ff")                     // false

readScore(dir, "march.pdf")            // the file's contents, nil
readScore(dir, "../../etc/passwd.pdf") // nil, an error: the name leaves the folder
readScore(dir, "notes.txt")            // nil, an error wrapping ErrNotScore

renderWelcome(w, "Ada <3", "cornet")
```

The last call writes:

```text
<h1>Welcome, Ada &lt;3!</h1>
<p><a href="/scores?part=cornet">Scores for cornet</a></p>
```
