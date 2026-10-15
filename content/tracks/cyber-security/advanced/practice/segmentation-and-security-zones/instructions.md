Complete `solution.sh`. It is run as `bash solution.sh POLICY CHECKS` and tests a zone policy
by the first-match rule.

1. **The policy.** `POLICY` is a CSV file with the header `seq,from,to,proto,port,action`. Skip
   blank lines, lines starting with `#` and the header. In the other lines:
   - `seq` is a whole number, and **rules are evaluated in ascending numeric `seq` order**,
     whatever their order in the file;
   - `from` and `to` are zone names or `any`; `proto` is `tcp`, `udp` or `any`; `port` is one
     port (`443`), an inclusive range (`8000-8100`) or `any`; `action` is `allow` or `deny`;
   - these fields may be written in any case: compare them in lower case.
2. **The decision.** A rule matches a connection when its `from`, `to` and `proto` are each `any`
   or equal to the connection's, and its `port` is `any` or contains the connection's port.
   The **first** matching rule decides. When no rule matches, the decision is `deny` by default.
3. **The checks.** `CHECKS` has lines `EXPECT FROM TO PROTO/PORT` (fields separated by one or
   more spaces), where `EXPECT` is `allow` or `deny`. Skip blank lines and lines starting with
   `#`. For each check, in file order, print one line:

   ```text
   STATUS FROM TO PROTO/PORT DECISION (rule SEQ)
   STATUS FROM TO PROTO/PORT DECISION (default)
   ```

   `STATUS` is `PASS` when the decision equals `EXPECT`, otherwise `FAIL`; `DECISION` is `allow`
   or `deny` in lower case; `(rule SEQ)` names the deciding rule and `(default)` means no rule
   matched.
4. Finally print `SUMMARY <p> passed, <f> failed`, and exit with status 1 if any check failed,
   otherwise 0.

**Example.** `bash solution.sh data/zone-policy.csv data/expected-isolation.txt` prints

```text
PASS guest plant tcp/502 deny (default)
PASS office plant tcp/502 deny (rule 90)
PASS mgmt plant tcp/22 allow (rule 60)
PASS wan dmz tcp/443 allow (rule 30)
PASS wan hist tcp/5432 deny (default)
PASS office hist tcp/8080 allow (rule 80)
FAIL office plant tcp/3389 allow (rule 25)
SUMMARY 6 passed, 1 failed
```

and exits with status 1. Rule 25 is last in the file but is evaluated before rule 90, so the
helpdesk's RDP rule lets office laptops reach the plant controllers.

**Tips.** `sort -t, -k1,1n` sorts on the first field as a number, and `tr '[:upper:]'
'[:lower:]'` lowers the case. In awk, `split("8000-8100", r, "-")` returns 2 for a range.
`${service%/*}` and `${service#*/}` split `tcp/502` into `tcp` and `502`.
