Complete `solution.sh`. It is run as `bash solution.sh EVE SUPPRESS` and prints a triage list of
the IDS/IPS alerts in a Suricata `eve.json` file.

1. **Alerts.** `EVE` has one JSON object per line. Keep only the lines whose `event_type` is
   `"alert"`; each has `src_ip`, `dest_ip` and an `alert` object with `action` (`"blocked"` or
   `"allowed"`), `signature_id`, `signature` and `severity` (1 is the most severe).
2. **Suppressions.** `SUPPRESS` is in Suricata's `threshold.config` form. Skip blank lines and
   lines starting with `#`. Every other line is one of

   ```text
   suppress gen_id 1, sig_id SID
   suppress gen_id 1, sig_id SID, track by_src, ip ADDRESS
   suppress gen_id 1, sig_id SID, track by_dst, ip ADDRESS
   ```

   and leaves out the alerts with that `signature_id`: all of them, only those whose `src_ip` is
   `ADDRESS` (`by_src`), or only those whose `dest_ip` is `ADDRESS` (`by_dst`). `ADDRESS` is
   one address, compared as text.
3. **Groups.** The alerts left with the same `signature_id` and `src_ip` form one group. A group
   is `FOLLOW-UP` when at least one of its alerts was `allowed` (the IPS only logged it), and
   `BLOCKED` when all were blocked.
4. **Print** one line per group:

   ```text
   STATUS sevSEVERITY SRC_IP sid:SID xCOUNT SIGNATURE
   ```

   All `FOLLOW-UP` lines first, then all `BLOCKED` lines. Within each, sort by severity
   (1 first), then by count (largest first), then by source address in byte order
   (`LC_ALL=C`), then by signature ID as a number.
5. Exit with status 1 if there is a `FOLLOW-UP` line, otherwise 0. With no alerts left, print
   nothing.

**Example.** `bash solution.sh data/eve.json data/threshold.config` prints

```text
FOLLOW-UP sev1 192.0.2.140 sid:1000005 x2 LOCAL SQL injection in search parameter
FOLLOW-UP sev2 198.51.100.23 sid:1000003 x3 LOCAL Possible SSH brute force
FOLLOW-UP sev3 10.30.0.7 sid:1000009 x1 LOCAL Request for /admin path
BLOCKED sev1 203.0.113.77 sid:1000001 x3 LOCAL Path traversal in URI
BLOCKED sev1 203.0.113.77 sid:1000005 x1 LOCAL SQL injection in search parameter
```

and exits with status 1. One of 192.0.2.140's two injection attempts arrived on a second
interface where the IPS was only alerting, so that group needs a follow-up. The `/admin` alerts
from the uptime monitor 10.20.0.40 and every TLS 1.0 alert are suppressed.

**Tips.** `jq -r 'select(.event_type == "alert") | [.alert.severity, .src_ip, ...] | @tsv'`
gives one tab-separated line per alert. awk can count groups in arrays, and `sort -t$'\t'`
with keys such as `-k1,1n -k3,3nr` sorts on several columns.
