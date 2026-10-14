---
title: Networking Basics
summary: Read IPv4 and IPv6 addresses and prefixes, inspect interfaces, addresses and routes with ip, see which programs listen on which ports with ss, and test reachability with ping and tracepath.
minutes: 30
objectives:
  - Work out the network, netmask and size of an IPv4 prefix, and tell private, public and loopback addresses apart
  - Show and change interfaces, addresses and routes with `ip`, and explain why such changes are not persistent
  - List listening sockets and their processes with `ss`, and explain TCP, UDP and ICMP
  - Troubleshoot a connection in a fixed order of link, address, route, name and port
---

## Outline

1. Addresses and prefixes
2. TCP, UDP, ICMP and ports
3. Interfaces, addresses and routes with ip
4. Making it permanent
5. Sockets with ss
6. Is it reachable?

## Addresses and prefixes

An **IPv4 address** is 32 bits, written as four bytes in decimal: `192.168.10.37`. A **prefix**
says how many leading bits name the network; the rest name the host. In **CIDR notation** it
follows a slash: `192.168.10.37/22` means the first 22 bits are the network. The same thing as a
**netmask** is a run of 22 one-bits, `255.255.252.0`. Two hosts talk directly only if they are in
the same network; anything else goes through a **router**. The arithmetic is just bitwise AND,
which Bash can do:

```bash
ip=192.168.10.37 prefix=22
IFS=. read -r a b c d <<< "$ip"
addr=$(( (a << 24) | (b << 16) | (c << 8) | d ))
mask=$(( (0xFFFFFFFF << (32 - prefix)) & 0xFFFFFFFF ))
net=$(( addr & mask )); bcast=$(( net | (~mask & 0xFFFFFFFF) ))
to_ip() { echo "$(( $1 >> 24 & 255 )).$(( $1 >> 16 & 255 )).$(( $1 >> 8 & 255 )).$(( $1 & 255 ))"; }
echo "netmask   $(to_ip "$mask")"; echo "network   $(to_ip "$net")/$prefix"
echo "broadcast $(to_ip "$bcast")"; echo "hosts     $(( (1 << (32 - prefix)) - 2 ))"
```

```text
netmask   255.255.252.0
network   192.168.8.0/22
broadcast 192.168.11.255
hosts     1022
```

The first address names the network and the last is the **broadcast** address, so a /22 has
1022 usable host addresses and a /24 has 254. Some ranges are special. **Private** addresses
(`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`) are free to use inside any organisation but are
not routed on the internet; a router translates them to a public address (**NAT**). `127.0.0.0/8`
is **loopback**: `127.0.0.1` always means "this machine", and a service listening only there
cannot be reached from outside. `169.254.0.0/16` is **link-local**, the address a machine gives
itself when DHCP fails, a useful clue in itself.

**IPv6** addresses are 128 bits, written in hexadecimal groups with `::` replacing one run of
zeros: `2001:db8:10::25/64`. Every subnet is normally a /64, addresses are plentiful enough that
NAT is not needed, hosts can configure themselves from router announcements (**SLAAC**), every
interface also has a link-local `fe80::` address, and loopback is `::1`.

## TCP, UDP, ICMP and ports

**TCP** delivers a reliable, ordered stream: it sets up a connection with a handshake,
retransmits lost data and is used by SSH, HTTP and databases. **UDP** sends single datagrams with
no connection and no guarantee, which suits DNS queries, NTP and streaming. Both identify the
service on a host with a 16-bit **port** number. **ICMP** carries control messages such as "echo
request", "destination unreachable" and "time exceeded"; it has no ports, and `ping` uses it.

Ports below 1024 are **privileged**: only root can listen on them. `/etc/services` maps names to
numbers. Ports worth knowing: 20 and 21 FTP, 22 SSH, 23 Telnet, 25 SMTP, 53 DNS, 80 HTTP, 110 POP3,
123 NTP, 143 IMAP, 161 and 162 SNMP, 389 LDAP, 443 HTTPS, 465 SMTPS, 514 syslog, 636 LDAPS, 993 IMAPS
and 995 POP3S.

## Interfaces, addresses and routes with ip

The `ip` command from **iproute2** replaces the older `ifconfig`, `route` and `netstat`
(**net-tools**), which you will still meet on old systems and in old documentation. The course
sandbox has no network, so this is a typical server:

```bash
ip -br link
ip -br address
ip route
ip route get 1.1.1.1
```

```text
lo               UNKNOWN        00:00:00:00:00:00 <LOOPBACK,UP,LOWER_UP>
ens3             UP             52:54:00:4a:1c:07 <BROADCAST,MULTICAST,UP,LOWER_UP>
lo               UNKNOWN        127.0.0.1/8 ::1/128
ens3             UP             10.20.0.12/24 fe80::5054:ff:fe4a:1c07/64
default via 10.20.0.1 dev ens3 proto dhcp src 10.20.0.12 metric 100
10.20.0.0/24 dev ens3 proto kernel scope link src 10.20.0.12
1.1.1.1 via 10.20.0.1 dev ens3 src 10.20.0.12 uid 1000
    cache
```

`-br` is the brief format. An interface marked `UP` with `LOWER_UP` is enabled and has a link;
`NO-CARRIER` means the cable or virtual link is down. The routing table says: hosts in
`10.20.0.0/24` are reached directly, and everything else goes to the **default gateway**
`10.20.0.1`. `ip route get` asks the kernel which route a packet to that address would really
take, which settles arguments quickly.

Changes need root and take effect at once:

```bash
sudo ip link set ens4 up
sudo ip address add 192.0.2.10/24 dev ens4
sudo ip route add 198.51.100.0/24 via 192.0.2.1
```

Be careful over SSH: deleting the address or the default route your session uses cuts you off.

## Making it permanent

Everything `ip` changes lives only in the running kernel and is lost at reboot. The permanent
configuration belongs to a network manager, and which one depends on the system:
**NetworkManager** (desktops, Red Hat family; command line `nmcli`), **netplan** files in
`/etc/netplan/` on Ubuntu servers, **systemd-networkd**, or `/etc/network/interfaces` with
`ifup` and `ifdown` on a classic Debian server. For example:
`nmcli connection modify ens3 ipv4.addresses 10.20.0.12/24 ipv4.gateway 10.20.0.1 ipv4.method manual`
followed by `nmcli connection up ens3`. The host name is in `/etc/hostname` and set with
`hostnamectl set-hostname web01`.

## Sockets with ss

A **socket** is one end of a connection. A **listening** socket waits for connections on an
address and port; which address matters: `0.0.0.0` or `*` means every IPv4 address (reachable
from the network), `[::]` every IPv6 address, and `127.0.0.1` only this machine. On a typical
server:

```bash
sudo ss -tlnp
```

```text
State  Recv-Q Send-Q Local Address:Port  Peer Address:Port Process
LISTEN 0      128          0.0.0.0:22         0.0.0.0:*     users:(("sshd",pid=901,fd=3))
LISTEN 0      200        127.0.0.1:5432       0.0.0.0:*     users:(("postgres",pid=1102,fd=6))
LISTEN 0      511          0.0.0.0:80         0.0.0.0:*     users:(("nginx",pid=1204,fd=6))
```

`-t` TCP, `-u` UDP, `-l` listening only, `-n` numbers instead of names, `-p` the process (other
users' processes are shown only to root). PostgreSQL here is safe from the network because it
listens on loopback only. Drop `-l` and use `-a` to see established connections as well, and
filter with expressions such as `ss -tn state established '( dport = :443 )'`. Saved output is
easy to summarise, for example connections per client address:

```bash
awk 'NR > 1 { sub(/:[0-9]+$/, "", $5); print $5 }' ss-tn.txt | sort | uniq -c | sort -rn
```

```text
      3 10.20.0.31
      1 203.0.113.50
      1 10.20.0.32
```

## Is it reachable?

Work from the bottom up. **Link**: does `ip -br link` show the interface `UP`? **Address**: does
it have the address and prefix you expect? **Route**: is there a default route, and does
`ip route get` pick the right gateway? **Reachability**: `ping -c 3 10.20.0.1` sends three echo
requests and prints the loss and round-trip times; it exits 0 if any reply came back. A ping that
fails proves little, since many firewalls drop ICMP. **Path**: `tracepath` or `traceroute` lists
the routers on the way, so you see where packets stop; `tracepath` needs no root and also
reports the path **MTU**, the largest packet that fits. **Name**: covered in the next lesson.
**Port**: `nc -zv 10.20.0.15 5432` tries a TCP connection; on the server, `ss -tlnp` shows whether
anything listens, and on which address.

## Common mistakes

- Making a change with `ip` and expecting it to survive a reboot.
- Testing a service only with `ping`: ICMP can be blocked while the port works, and the reverse.
- A service listening on `127.0.0.1` when it should accept remote clients, or on `0.0.0.0` when it should not.
- Confusing the network address or broadcast address with a usable host address.
- Removing the default route or address of the interface your SSH session uses.

## Practice

1. How many usable host addresses has `10.4.0.0/26`, and what is its broadcast address?
2. `ss -tlnp` shows `127.0.0.1:6379` for Redis, and an application on another server cannot connect. Why?
3. A server reached the internet yesterday; today `ip route` shows only `10.20.0.0/24 dev ens3 ...`. What is missing and how do you add it temporarily?

### Answers

1. A /26 leaves 6 host bits: 64 addresses, 62 usable. The broadcast address is `10.4.0.63`.
2. Redis listens on loopback only, so connections from other machines are refused. Change its
   bind address (and protect it with a firewall and a password) if remote access is intended.
3. The default route. `sudo ip route add default via 10.20.0.1` restores it until the next
   reboot; then find out why the network configuration (DHCP or static) did not set it.

## Key takeaways

- A prefix splits an address into network and host bits; know the private and loopback ranges.
- `ip -br address`, `ip route` and `ip route get` answer most "where does this go" questions.
- `ip` changes are temporary; permanent settings belong to NetworkManager, netplan, networkd or ifupdown.
- `ss -tlnp` shows who listens on which address and port.
- Troubleshoot in order: link, address, route, reachability, name, port.

## Further reading

- [ip-address(8) manual page](https://man7.org/linux/man-pages/man8/ip-address.8.html)
- [ip-route(8) manual page](https://man7.org/linux/man-pages/man8/ip-route.8.html)
- [ss(8) manual page](https://man7.org/linux/man-pages/man8/ss.8.html)
- [ping(8) manual page](https://man7.org/linux/man-pages/man8/ping.8.html)
