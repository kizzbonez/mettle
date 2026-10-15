# TXT parsing, SPF and DMARC rules, and a review with nothing to report.
import os
import tempfile

lines = [
    "; exported 2027-01-15",
    "",
    'Example.ORG.   300 IN TXT "v=spf1 ip4:192.0.2.0/24 -" "all"',
    'example.org.   300 IN TXT "verification=abc123"',
    '_dmarc.example.org. 300 IN TXT "v=DMARC1; " "p=reject"',
]
txt = parse_txt(lines)
assert isinstance(txt, dict), f"parse_txt should return a dict, not {type(txt).__name__}"
assert set(txt) == {"example.org", "_dmarc.example.org"}, (
    f"owners lose their trailing dot and are lower-cased; comments and blank lines are skipped; got keys {sorted(txt)}")
assert txt["example.org"] == ["v=spf1 ip4:192.0.2.0/24 -all", "verification=abc123"], (
    f"the quoted strings of one record are joined with nothing between them, records kept in file order; got {txt['example.org']}")
assert email_findings(txt, ["example.org"]) == [], "a domain with -all SPF and p=reject DMARC has no findings"


def check(spf, dmarc, domain="d.example"):
    records = {}
    if spf is not None:
        records[domain] = spf if isinstance(spf, list) else [spf]
    if dmarc is not None:
        records[f"_dmarc.{domain}"] = [dmarc]
    return email_findings(records, [domain])


good = "v=DMARC1; p=quarantine"
assert check(None, None) == ["MAIL-SPF-MISSING d.example", "MAIL-DMARC-MISSING d.example"], (
    "a domain with no records misses both SPF and DMARC, SPF reported first")
assert check(["verification=xyz"], good) == ["MAIL-SPF-MISSING d.example"], "a TXT record that is not v=spf1 is not SPF"
got = check(["v=spf1 mx -all", "v=spf1 include:mail.example ~all"], good)
assert got == ["MAIL-SPF-MULTIPLE d.example"], f"two SPF records are one finding and nothing else about SPF; got {got}"
assert check("v=spf1 mx ~all", good) == [], "~all is acceptable"
assert check("V=SPF1 MX -ALL", good) == [], "SPF is matched without regard to case"
got = check("v=spf1 include:mail.example ?all", good)
assert got == ["MAIL-SPF-WEAK d.example ?all"], f"?all is weak; got {got}"
got = check("v=spf1 mx all", good)
assert got == ["MAIL-SPF-WEAK d.example all"], f"an all term without a qualifier passes everyone; got {got}"
got = check("v=spf1 mx", good)
assert got == ["MAIL-SPF-WEAK d.example no-all"], f"a record with no all term and no redirect is weak; got {got}"
assert check("v=spf1 redirect=_spf.example.net", good) == [], "a record that ends in a redirect= modifier has no all term but is not weak"

assert check("v=spf1 -all", "v=DMARC1; p=none; rua=mailto:r@d.example") == ["MAIL-DMARC-NONE d.example"], "p=none is a DMARC finding"
assert check("v=spf1 -all", "v=DMARC1; rua=mailto:r@d.example") == ["MAIL-DMARC-NONE d.example"], "a DMARC record without p counts as p=none"
assert check("v=spf1 -all", "v=DMARC1;p=Reject;adkim=s") == [], "tags may have no spaces and values any case"
assert check("v=spf1 -all", "v=spf1 -all") == ["MAIL-DMARC-MISSING d.example"], "a record at _dmarc that is not v=DMARC1 is not DMARC"
got = email_findings({"sub.d.example": ["v=spf1 -all"], "_dmarc.d.example": [good]}, ["sub.d.example"])
assert got == ["MAIL-DMARC-MISSING sub.d.example"], f"each listed domain needs its own _dmarc record; got {got}"
got = email_findings({}, ["b.example", "a.example"])
assert got == ["MAIL-SPF-MISSING b.example", "MAIL-DMARC-MISSING b.example",
               "MAIL-SPF-MISSING a.example", "MAIL-DMARC-MISSING a.example"], f"domains are reported in the order given; got {got}"

# A clean environment: nothing to report, exit status 0.
with tempfile.TemporaryDirectory() as folder:
    files = {
        "firewall-rules.csv": "seq,name,src_zone,src,dst_zone,dst,proto,port,action\n"
                              "10,web,internet,any,dmz,203.0.113.10,tcp,443,allow\n",
        "accounts.csv": "sam_account,display_name,type,enabled,last_logon,groups\n"
                        "ana,Ana,user,true,2026-09-30,Staff\n",
        "mail-domains.txt": "# one domain\nclean.example\n",
        "dns-txt.txt": 'clean.example. 300 IN TXT "v=spf1 -all"\n_dmarc.clean.example. 300 IN TXT "v=DMARC1; p=reject"\n',
    }
    for name, text in files.items():
        with open(os.path.join(folder, name), "w") as handle:
            handle.write(text)
    ran = run_script(args=[folder])
    assert ran.code == 0, f"a review with no findings should exit with status 0; it exited with {ran.code}\n{ran.err}"
    assert ran.out.splitlines() == ["TOTAL 0"], f"a review with no findings should print only its total; it printed:\n{ran.out}"
