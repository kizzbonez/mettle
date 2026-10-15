Complete `solution.sh`. It is run as `bash solution.sh TODAY INVENTORY`, where `TODAY` is a
date such as `2026-10-16` and `INVENTORY` is a CSV with the columns
`host,os,support_ends,last_patched,edr_agent,exposure,open_ports,owner`.

1. **Read** the inventory. Skip lines starting with `#` and blank lines; the first other line is
   the header. The file comes from a spreadsheet, so lines may end with `\r\n`: remove the `\r`.
   `open_ports` is a list of port numbers separated by spaces (it may be empty). Dates are
   `YYYY-MM-DD` or the word `unknown`.
2. **Check** each host and collect its findings in this order:
   1. `unknown-os` when `support_ends` is `unknown`; otherwise `unsupported` when
      `support_ends` is before `TODAY` (support ending today still counts as supported);
   2. `unpatched` when `last_patched` is `unknown` or more than 30 days before `TODAY` (a patch
      exactly 30 days ago is fine);
   3. `unmanaged` when `edr_agent` is not `yes`;
   4. `exposed:PORT` for each management port (22 SSH, 23 Telnet, 3389 RDP, 5900 VNC) in
      `open_ports` of a host whose `exposure` is `internet`, in ascending port order;
   5. `no-owner` when `owner` is empty.
3. **Print** `HOST: FINDING FINDING ...` for each host with at least one finding, in file order,
   then the line `N of M hosts need action`, where `M` counts the hosts read. Exit with status
   1 when `N` is more than 0, otherwise 0.

**Example.** `bash solution.sh 2026-10-16 data/inventory.csv` prints the following and exits
with status 1:

```text
pms-02: unsupported unpatched
guest-wifi-ctl: unpatched unmanaged exposed:22
kiosk-lobby-1: no-owner
lock-server: unknown-os unpatched unmanaged no-owner
door-vnc-pc: unsupported unpatched exposed:3389 exposed:5900
ops-jump: exposed:22
6 of 8 hosts need action
```

`pms-02` has RDP open, but only to the internal network. `door-vnc-pc` also listens on 2222,
which is not a management port. `ops-jump` was patched exactly 30 days ago.

**Tips.** `date -d "$today -30 days" +%F` gives the cutoff date, and ISO dates compare
correctly as strings, also in `awk`. In `awk`, `sub(/\r$/, "")` removes the `\r`, and
`split($7, ports, " ")` splits the ports so that `22` is not found inside `2222`. `exit (n > 0)`
in an `END` block sets the status.
