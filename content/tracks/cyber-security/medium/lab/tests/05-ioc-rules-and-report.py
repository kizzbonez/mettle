# IoC matching rules on files built for the test, then the report on a quiet day.
import csv
import io
import tempfile
from pathlib import Path

folder = Path(tempfile.mkdtemp())
H1 = "aa" * 32
H2 = "bb" * 32
iocs = [
    ("type", "value", "source"),
    ("sha256", H1.upper(), "feed"),
    ("domain", "evil.example.net", "feed"),
    ("domain", "drop.example.org", "feed"),
    ("ipv4", "10.1.1.1", "feed"),
    ("ipv4", "10.9.9.9", "feed"),
]
procs = [
    ("host", "time", "user", "pid", "ppid", "image", "command_line", "sha256"),
    ("h1", "t1", "u", "1", "0", "a.exe", "a.exe --c2 evil.example.net", H1),             # hash wins over domain
    ("h2", "t2", "u", "2", "0", "b.exe", "b.exe http://EVIL.example.NET/x", H2),         # domain, any case
    ("h3", "t3", "u", "3", "0", "c.exe", "c.exe x.evil.example.net", H2),                # subdomain: no
    ("h4", "t4", "u", "4", "0", "d.exe", "d.exe notevil.example.net-backup", H2),        # embedded: no
    ("h5", "t5", "u", "5", "0", "e.exe", "e.exe 10.1.1.10", H2),                         # longer IP: no
    ("h6", "t6", "u", "6", "0", "f.exe", "f.exe http://10.1.1.1:8080/p", H2),            # IP with port
    ("h7", "t7", "u", "7", "0", "g.exe", "g.exe 10.9.9.9 drop.example.org", H2),         # domain before IP
    ("h8", "t8", "u", "8", "0", "h.exe", 'h.exe "--server=drop.example.org"', H2),        # quoted, after =
    ("h9", "t9", "u", "9", "0", "i.exe", "i.exe 110.1.1.1", H2),                         # IP inside a longer one
]


def write_csv(name, rows):
    buffer = io.StringIO()
    csv.writer(buffer, lineterminator="\n").writerows(rows)
    (folder / name).write_text(buffer.getvalue())


write_csv("processes.csv", procs)
write_csv("iocs.csv", iocs)
got = ioc_matches(folder / "processes.csv", folder / "iocs.csv")
assert isinstance(got, list), "ioc_matches returns a list"
hosts = [g.get("host") for g in got]
assert "h3" not in hosts and "h4" not in hosts, "a domain inside a longer name does not match (whole-token rule)"
assert "h5" not in hosts and "h9" not in hosts, "an IP inside a longer address does not match (whole-token rule)"
assert hosts.count("h1") == 1, "each process is reported at most once"
by_host = {g["host"]: g for g in got}
assert by_host["h1"] == {"host": "h1", "time": "t1", "image": "a.exe", "match": "sha256", "indicator": H1.upper()}, (
    "a hash match ignores case, wins over a domain match, and reports the IoC value as written in the IoC file"
)
assert by_host.get("h2", {}).get("match") == "domain", "domains match ignoring case, also inside a URL"
assert by_host.get("h6", {}).get("indicator") == "10.1.1.1", "an IP followed by a port matches"
assert by_host.get("h7", {}).get("match") == "domain", "domain IoCs are checked before IPv4 IoCs"
assert by_host.get("h8", {}).get("indicator") == "drop.example.org", "a value after '=' or a quote matches"
assert hosts == ["h1", "h2", "h6", "h7", "h8"], f"results follow the order of the processes file (got {hosts})"

write_csv("no-iocs.csv", [("type", "value", "source")])
assert ioc_matches(folder / "processes.csv", folder / "no-iocs.csv") == [], "an empty IoC list matches nothing"

# A quiet day: nothing to report except the probe count line.
quiet = folder / "quiet"
quiet.mkdir()
(quiet / "auth.log").write_text(
    "2026-10-15T07:00:00.000000+00:00 jump01 sshd[1]: Accepted publickey for deploy from 10.0.0.5 port 1 ssh2\n"
)
(quiet / "signins.csv").write_text("time,user,result,ip,city,country,lat,lon,app\n")
(quiet / "access.log").write_text('192.0.2.1 - - [15/Oct/2026:07:00:00 +0000] "GET / HTTP/1.1" 200 10 "-" "-"\n')
(quiet / "processes.csv").write_text("host,time,user,pid,ppid,image,command_line,sha256\n")
(quiet / "iocs.csv").write_text("type,value,source\n")
assert report(quiet) == ["Web probes: 0 (0 traversal, 0 injection) from 0 IPs, 0 answered 200"], (
    "with nothing found, the report is just the web probes line with zeros"
)

# Report formatting with results in every section.
busy = folder / "busy"
busy.mkdir()
(busy / "auth.log").write_text("".join(
    f"2026-10-15T07:00:{i:02d}.000000+00:00 jump01 sshd[{i}]: Failed password for root from 192.0.2.9 port 1 ssh2\n"
    for i in range(12)
))
(busy / "signins.csv").write_text(
    "time,user,result,ip,city,country,lat,lon,app\n"
    "2026-10-15T08:00:00Z,zoe,success,192.0.2.1,London,GB,51.5074,-0.1278,Teams\n"
    "2026-10-15T10:00:00Z,zoe,success,192.0.2.2,Tokyo,JP,35.6762,139.6503,Teams\n"
)
(busy / "access.log").write_text('192.0.2.3 - - [15/Oct/2026:07:00:00 +0000] "GET /a/../../b HTTP/1.1" 404 10 "-" "-"\n')
write_csv("busy/processes.csv", procs[:2])
write_csv("busy/iocs.csv", iocs)
lines = report(busy)
assert lines[0] == "SSH brute-force: 192.0.2.9 (12 failures, 1 accounts)", "SSH lines follow the stated format"
assert lines[1].startswith("Impossible travel: zoe London -> Tokyo (") and lines[1].endswith(" h)"), (
    "travel lines follow the stated format"
)
assert lines[1].split(" in ")[1] == "2.00 h)", "hours in the report always show two decimals"
assert lines[2] == "Web probes: 1 (1 traversal, 0 injection) from 1 IPs, 0 answered 200", "the probe line counts kinds, IPs and 200s"
assert lines[3] == f"IoC sha256: h1 a.exe ({H1.upper()})", "IoC lines follow the stated format"
assert len(lines) == 4, "the report has one line per finding plus the probe line"
