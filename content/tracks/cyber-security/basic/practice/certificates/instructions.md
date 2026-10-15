The script is run as `bash solution.sh CSR DOMAIN`, for example
`bash solution.sh data/printhub.csr fenwick.test`. Before the university's CA signs a certificate
signing request, the request must pass the issuance policy below. The starter already reads the
CSR as text into `$text`, pulls the names and the key size out of it, and prints the findings.
Fill in the four places marked `YOUR CODE`:

1. **A valid CSR.** The lesson ran `openssl req -in portal.csr -noout -verify`. Its message goes to
   standard error, so add `2>&1` before piping it to `grep -q 'verify OK'`. Careful: OpenSSL 3.0
   exits with status 0 even when the self-signature does **not** verify, so test the text, never
   the exit status. Replace `false` with that pipeline, turned around with `!`, so that the
   script prints `INVALID-CSR` and exits with status 2 when the file is missing, is not a CSR, or
   was changed after it was signed.
2. **The SAN line.** As in the lesson, `grep -A1 'X509v3 Subject Alternative Name'` prints the
   matching line and the line after it; `tail -n 1` keeps only the second, such as
   `DNS:print.fenwick.test, IP Address:10.20.0.15`. Replace `echo` with
   `printf '%s\n' "$text" | grep ... | tail ...`. The starter then makes the array `names` of the
   DNS names in lower case, and adds `NO-SAN` when there are none (the common name never counts)
   and `WILDCARD NAME` for a name starting with `*.` (a wildcard spreads one private key over many
   servers).
3. **Names outside the domain.** Add an `elif` that adds `OUTSIDE-DOMAIN NAME` when the name is
   neither `$domain` itself nor ends with `.$domain`, so `notfenwick.test` is outside
   `fenwick.test`. `$domain` is already lower case.
4. **Weak keys.** The starter sets `$bits` to the key size and `$minimum` to 2048 for RSA, 256 for
   an elliptic curve and 0 for other key types such as Ed25519. Add `WEAK-KEY` when `$bits` is not
   empty and is less than `$minimum`.

Findings come in this order: `NO-SAN` or the name findings, then `WEAK-KEY`. With no findings the
script prints `OK` and exits 0; otherwise it exits 1.

**Example.**

```console
$ bash solution.sh data/printhub.csr fenwick.test
WILDCARD *.print.fenwick.test
OUTSIDE-DOMAIN printhub.fenwick-print.test
WEAK-KEY
$ bash solution.sh data/gradebook.csr fenwick.test
OK
$ bash solution.sh data/library.csr fenwick.test
NO-SAN
```

**Tips.** In `[[ $name != *".$domain" ]]`, the `*` matches any text and the quoted part must
match exactly; `&&` joins two tests that must both hold. `[ -n "$bits" ]` succeeds when `$bits`
is not empty, and `[ "$bits" -lt "$minimum" ]` compares two numbers. Copy the `if` and
`findings+=(...)` lines of the starter for the shape.
