Complete `solution.sh`. It is run as `bash solution.sh LOG GATEWAY`, where `LOG` is the syslog
file of the monitoring host (arpwatch and the access switches log to it) and `GATEWAY` is the
default gateway's IP address, such as `10.40.0.1`.

1. **MAC addresses** are written in two styles: arpwatch drops leading zeros
   (`0:c:29:5e:a1:7`) and the switches use dotted groups (`000c.295e.a107`). Always report a MAC
   as six lower-case, two-digit groups joined by colons: `00:0c:29:5e:a1:07`.
2. **ARP changes.** Only two arpwatch messages count, both followed by `IP NEW (OLD) IFACE`:
   `arpwatch: changed ethernet address ...` and `arpwatch: flip flop ...`. For each IP, count
   these events and collect every MAC, new or old, they mention. Ignore `new station`,
   `new activity` and every other line.
3. **Rogue DHCP.** Count the lines containing `DHCP_SNOOPING_UNTRUSTED_PORT` whose
   `message type:` is `DHCPOFFER` or `DHCPACK` (server messages), per the MAC after `MAC sa:`
   at the end of the line. Other message types and other `DHCP_SNOOPING` events do not count.
4. **Print** one line per IP with ARP changes, in the order each IP first changed:
   `arp IP changes=N macs=MAC,MAC` with its distinct MACs sorted and joined by commas, and
   ` gateway` at the end when the IP is exactly `GATEWAY`. Then one line per DHCP server MAC, in
   the order of its first drop: `dhcp MAC dropped=N`.
5. **Exit status**: 2 when the gateway's address changed (everyone's traffic may pass the
   attacker), otherwise 1 when anything was printed. With no findings at all, print
   `no spoofing seen` and exit with status 0.

**Example.** `bash solution.sh data/monitor.log 10.40.0.1` prints the following and exits with
status 2:

```text
arp 10.40.0.1 changes=3 macs=00:0c:29:5e:a1:07,00:50:56:9a:10:01 gateway
arp 10.40.2.31 changes=1 macs=f8:75:a4:01:c3:9d,f8:75:a4:01:c3:9e
dhcp 00:0c:29:5e:a1:07 dropped=3
dhcp 3c:52:82:1a:2b:3c dropped=1
```

The device `00:0c:29:5e:a1:07` both claims the gateway's address and offers DHCP leases: an
on-path attacker on a hot desk. `3c:52:82:1a:2b:3c` looks like a travel router someone plugged
in. `10.40.2.31` changed once, perhaps a laptop moving from Wi-Fi to a dock; it is still listed
for someone to check.

**Tips.** In `awk`, loop over the fields to find `address` or `flop`; the IP, the new MAC and
the old MAC follow it. `gsub(/[()]/, "", old)` removes the parentheses, `split(mac, parts, ":")`
and `substr` rebuild a MAC, and `$NF` is the last field. gawk's `asort(array)` sorts the
values of an array. An array indexed by the order of first appearance keeps that order.
