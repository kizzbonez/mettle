Write two functions in `solution.py`. The starter parses a message with
`message_from_string(raw, policy=policy.default)`, which unfolds and decodes headers:
`msg["From"].addresses[0]` has `.display_name` and `.domain`, `msg["Reply-To"]` is `None` when
there is none, and `msg.get_all("Authentication-Results")` lists every such header (or is
`None`). Compare domains and names ignoring case. The starter also gives `one_edit_apart(a, b)`
and the constants used below.

1. `red_flags(raw)` returns the sorted list of the flags that apply to the message `raw`:
   - `"lookalike"`: the From domain is not `OUR_DOMAIN`, and either its IDNA form
     (`domain.encode("idna").decode("ascii")`) has a label starting with `xn--` (a homograph
     with non-Latin letters), or it is `one_edit_apart` from `OUR_DOMAIN` (a typo domain).
   - `"reply-to"`: there is a Reply-To whose domain differs from the From domain.
   - `"auth-fail"`: an `Authentication-Results` header added by **our** gateway (its text before
     the first `;` is `GATEWAY`) reports a result in `FAILURES`: `spf=fail`, `spf=softfail`,
     `dkim=fail`, `dkim=none` or `dmarc=fail`. Ignore the other `Authentication-Results`
     headers: a sender can write any it likes.
   - `"display-name"`: the From domain is not `OUR_DOMAIN` and the display name contains the
     name of one of the `EXECUTIVES`.
   - `"urgency"`: the Subject contains one of `URGENT_WORDS`.
2. `triage(paths)` reads each file (UTF-8) and returns a list of
   `(file name, score, verdict)` tuples, where the file name is the last part of the path, the
   score is the sum of `WEIGHTS` of its flags, and the verdict is `"phishing"` for a score of 5
   or more, `"suspicious"` for 2 to 4 and `"benign"` for 0 or 1. Order: highest score first,
   then file name.

**Example.** With the five reports in `data/`:

```python
red_flags(Path("data/report-01.eml").read_text(encoding="utf-8"))
# ['auth-fail', 'display-name', 'lookalike', 'reply-to', 'urgency']
triage(sorted(Path("data").glob("report-*.eml")))
# [('report-01.eml', 10, 'phishing'), ('report-05.eml', 4, 'suspicious'),
#  ('report-03.eml', 3, 'suspicious'), ('report-04.eml', 1, 'benign'),
#  ('report-02.eml', 0, 'benign')]
```

Report 1 is a textbook business email compromise: the `і` in `brіghtwell` is Cyrillic. Report
3 passes SPF, DKIM and DMARC, because the attacker set them up for the typo domain
`brightwel-build.example`. Report 4 carries a failing `Authentication-Results` header, but the
sender wrote it; our gateway's verdict is a pass.

**Tip.** `re.findall(r"\b(spf|dkim|dmarc)=([a-z]+)", text.lower())` returns pairs such as
`("dkim", "none")` that you can look up in `FAILURES`.
