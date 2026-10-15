Write `solution.py`. The starter already reads the files, defines the constants and has a `main`
that prints the report; you write the five functions it calls. Keep their names and parameters,
and add helper functions as you like. Use only the standard library. Each function returns a
`list` of finding strings (or, for `parse_txt`, a `dict`), in the order given below.

1. **`firewall_findings(rules)`** takes the rows of `firewall-rules.csv` as dicts of strings with
   the keys `seq,name,src_zone,src,dst_zone,dst,proto,port,action`:
   - `seq` is an integer. **Rules are evaluated in ascending numeric `seq` order**, and the export
     is not sorted (it lists rules in the order they were created).
   - `src_zone` and `dst_zone` are zone names or `any`.
   - `src` and `dst` are an IPv4 network in CIDR form (`10.10.0.0/16`), a single IPv4 address (a
     network of one address, `/32`), or `any`.
   - `proto` is `tcp`, `udp` or `any`; `port` is one port (`443`), an inclusive range
     (`8000-8100`) or `any` (every port, 0 to 65535); `action` is `allow` or `deny`.

   Going through the rules in `seq` order, report for each rule, in this order:

   - **`FW-SHADOWED <seq> by <earlier seq>`** when an earlier rule (of either action) **covers** it,
     so the rule can never match. An earlier rule covers a later one when all of these hold:
     each of its zones is `any` or equal to the later rule's; its `src` contains the later `src`
     and its `dst` contains the later `dst` (`any` contains everything, but a later `any` is
     contained only by `any`; otherwise use network containment); its `proto` is `any` or equal;
     and its port range contains the later rule's whole range. Name the **lowest-numbered**
     covering rule, and report a rule at most once.
   - **`FW-BROAD <seq>`** for an `allow` rule whose `port` is `any`.
   - **`FW-MGMT-EXPOSED <seq> ports <list>`** for an `allow` rule whose `src_zone` is not `mgmt`
     and whose `dst_zone` is not `internet`, when it allows at least one management port of
     `MGMT_PORTS`: a pair `(protocol, port)` is allowed when the rule's `proto` is that protocol
     or `any` and the port is inside the rule's range. `<list>` is each allowed port number once,
     in ascending order, joined by commas without spaces.

2. **`container_findings(project)`** takes one Compose project as parsed from JSON. It has a
   `"name"` and a `"services"` object (service name to definition). Review the services in
   **alphabetical order of their names**, and for each:
   - **`CT-PRIVILEGED <project>/<service>`** when `"privileged"` is `true`;
   - then, for each entry of `"ports"` in file order whose `"host_ip"` is missing, empty,
     `"0.0.0.0"` or `"::"` (all interfaces), **`CT-ALL-INTERFACES <project>/<service> <published>/<protocol>`**.
     Every entry has `"target"` and `"published"` (a string); `"protocol"` defaults to `tcp`.

3. **`account_findings(accounts, review_date)`** takes the rows of `accounts.csv`
   (`sam_account,display_name,type,enabled,last_logon,groups`) and a `datetime.date`. `type` is
   `user`, `admin` or `service`; `enabled` is `true` or `false`; `last_logon` is `YYYY-MM-DD` or
   empty; `groups` holds group names separated by `;`. Skip accounts whose `enabled` is not
   `true`. For the others, in file order:
   - **`ACCT-STALE <sam_account> never`** when `last_logon` is empty, or
     **`ACCT-STALE <sam_account> <days>`** when `review_date` is more than `STALE_DAYS` (90) days
     after `last_logon` (exactly 90 is not stale);
   - then, when one of its groups, with surrounding spaces removed and compared in lower case,
     is exactly a name in `PRIVILEGED_GROUPS`: **`ACCT-PRIVILEGED-USER <sam_account>`** for a
     `user` account or **`ACCT-PRIVILEGED-SERVICE <sam_account>`** for a `service` account.
     `admin` accounts are meant to be there.

4. **`parse_txt(lines)`** takes the lines of `dns-txt.txt` and returns a dict from owner name to
   the list of its TXT record texts, in file order. Skip blank lines and lines whose first
   non-space character is `;`. Every other line is `OWNER TTL IN TXT "..." ["..." ...]`. The key
   is the owner without its trailing dot, in lower case. A record's text is **all its quoted
   strings joined with nothing between them**, as RFC 7208 requires (`"v=spf1 -" "all"` is
   `v=spf1 -all`). The strings contain no escaped quotes.

5. **`email_findings(txt, domains)`** takes that dict and a list of domains, and reports for each
   domain, in the given order, its SPF finding and then its DMARC finding (at most one of each):
   - **SPF.** The SPF records are the texts at the domain that start with `v=spf1` followed by a
     space or the end, ignoring case. None: **`MAIL-SPF-MISSING <domain>`**. More than one (a
     `permerror`): **`MAIL-SPF-MULTIPLE <domain>`**. Exactly one: split it into terms on
     whitespace, in lower case. An *all term* is `all` with an optional qualifier `+`, `-`, `~`
     or `?`. If the record has an all term whose qualifier is `+`, `?` or missing, report
     **`MAIL-SPF-WEAK <domain> <term>`** (for example `+all`). If it has no all term and no term
     starting with `redirect=`, report **`MAIL-SPF-WEAK <domain> no-all`**. `-all` and `~all` are
     acceptable.
   - **DMARC.** Brightwater's policy is that **every listed domain publishes its own DMARC
     record**, subdomains included. The DMARC records are the texts at `_dmarc.<domain>` that start
     with `v=DMARC1`, ignoring leading spaces and case. None: **`MAIL-DMARC-MISSING <domain>`**.
     Otherwise take the first, split it on `;` into `name=value` tags (strip spaces; compare names
     and values in lower case), and report **`MAIL-DMARC-NONE <domain>`** when `p` is `none` or
     absent (RFC 9989 treats a missing `p` as `none`).

`main` (given) reads `data/` (or the folder given as the first argument), prints the firewall,
container (`compose-*.json` files in name order), account (with `REVIEW_DATE`) and email
(domains from `mail-domains.txt`, skipping blank and `#` lines) findings, one per line, then
`TOTAL <n>`, and exits with status 1 if there was any finding, otherwise 0.

**Example.** The sample files in `data/`:

```console
$ python solution.py; echo "exit status $?"
FW-BROAD 60
FW-MGMT-EXPOSED 60 ports 22,23,161,3389,5900,5985,5986
FW-SHADOWED 70 by 60
FW-MGMT-EXPOSED 100 ports 3389
FW-BROAD 110
FW-SHADOWED 120 by 60
FW-SHADOWED 130 by 10
FW-SHADOWED 140 by 60
FW-MGMT-EXPOSED 140 ports 22
CT-ALL-INTERFACES booking/db 5432/tcp
CT-PRIVILEGED booking/worker
CT-PRIVILEGED monitoring/cadvisor
CT-ALL-INTERFACES monitoring/cadvisor 8081/tcp
CT-ALL-INTERFACES monitoring/grafana 3000/tcp
ACCT-STALE jonas.weber 103
ACCT-PRIVILEGED-USER lena.marsh
ACCT-PRIVILEGED-SERVICE svc-backup
ACCT-STALE svc-scanner never
ACCT-STALE temp.locum 286
ACCT-STALE kai.ng 91
MAIL-SPF-MULTIPLE news.brightwater-vets.example
MAIL-DMARC-NONE news.brightwater-vets.example
MAIL-SPF-WEAK brightwater-pets.example +all
MAIL-DMARC-MISSING brightwatervets.example
TOTAL 24
exit status 1
```

Some lines worked through:

- Rule 140 appears in the export before rule 60, but 140 is evaluated after 60. Rule 60 covers
  it: same zones, `10.10.5.23` is inside `10.10.0.0/16`, `10.20.0.21` inside `10.20.0.0/24`,
  protocol `any` covers `tcp`, and port `any` covers 22. Rule 50 is not shadowed: it comes first.
- Rule 60 allows every port from `staff` to `servers`, so it is broad and exposes every
  management port. Rule 110 is broad too, but its destination is `internet`, so its management
  check does not apply. Rule 100 lets a vendor's internet range reach RDP.
- `brightwater-vets.example`'s SPF record is split into `"... -"` and `"all"`; joined without a
  space it ends in `-all`, which is acceptable. `Brightwater-Pets.example.` is the owner
  `brightwater-pets.example`.
- `kai.ng` last logged on 91 days before 2026-10-01 and is stale; `adm-noor`, at exactly 90
  days, is not.

**Tips.** `ipaddress.ip_network(text, strict=False)` reads both networks and single addresses,
and `a.subnet_of(b)` tests containment. A small `port_range(text)` helper returning
`(low, high)` makes both the shadow check and the management check short.
`date.fromisoformat()` reads the logon dates, and `re.findall(r'"([^"]*)"', line)` collects a
line's quoted strings.
