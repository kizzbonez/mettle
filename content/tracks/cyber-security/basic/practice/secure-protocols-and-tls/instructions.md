The program is run as `python solution.py CONF` on an nginx site configuration. The starter already
reads the `ssl_protocols` and `ssl_ciphers` directives (`read_directive`), builds the report
(`audit`) and prints it (`main`). Write the two functions that apply the rules from the lesson
(RFC 8996 and RFC 9325):

1. **`protocol_findings(protocols)`** takes the list of versions, such as
   `["TLSv1", "TLSv1.1", "TLSv1.2"]`, and returns a list of strings:
   - `PROTOCOL NAME deprecated` for each version in `DEPRECATED` (`SSLv2`, `SSLv3`, `TLSv1`,
     `TLSv1.1`), in the order listed;
   - then `PROTOCOL NAME missing` for each version of `REQUIRED` (`TLSv1.2`, then `TLSv1.3`) that
     is not in the list.

   Compare whole names: `TLSv1.2` is not `TLSv1`.
2. **`cipher_reason(suite)`** takes one OpenSSL suite name and returns why it is weak, or `None`.
   An entry starting with `!` is an exclusion (such as `!aNULL`, which removes suites and adds
   none): return `None`. Otherwise return the **first** reason that applies:
   - `"null"`: the name contains `NULL` (no encryption at all);
   - `"rc4"`: it contains `RC4`;
   - `"export"`: it starts with `EXP` (export-grade keys);
   - `"des"`: it contains `DES` (DES and 3DES);
   - `"no-forward-secrecy"`: it starts with neither `ECDHE-` nor `DHE-` (static RSA key exchange);
   - `"not-aead"`: it contains neither `GCM` nor `CHACHA20` (CBC mode, no AEAD);
   - `None` when none applies, as for `ECDHE-RSA-AES128-GCM-SHA256`.

**Example.** `python solution.py data/encore-nginx.conf` prints the following and exits with
status 1; `python solution.py data/encore-hardened.conf` prints `OK` and exits with status 0.

```text
PROTOCOL TLSv1 deprecated
PROTOCOL TLSv1.1 deprecated
PROTOCOL TLSv1.3 missing
CIPHER ECDHE-RSA-AES128-SHA256 not-aead
CIPHER AES128-GCM-SHA256 no-forward-secrecy
CIPHER DES-CBC3-SHA des
CIPHER RC4-SHA rc4
```

So `protocol_findings(["TLSv1", "TLSv1.1", "TLSv1.2"])` returns the first three lines, and
`cipher_reason("DES-CBC3-SHA")` returns `"des"`.

**Tip.** `"RC4" in suite` tests for text anywhere in the name, and `suite.startswith("EXP")` tests
how it starts. A chain of `if` tests that each `return` gives the first reason that applies.
