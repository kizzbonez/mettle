Complete `solution.sh`. It is run as `bash solution.sh FILE`, where `FILE` is the output of
`ip -br address`: one line per interface with its name, its state, and zero or more addresses
written as `ADDRESS/PREFIX`.

1. The interface name is the first column **up to any `@`**: `veth3@if12` is `veth3`.
2. For every **IPv4** address on the line, in order, print
   `NAME ADDRESS/PREFIX network NETWORK/PREFIX CLASS`. IPv6 addresses (they contain `:`) are
   skipped, and an interface without IPv4 addresses prints nothing.
3. `NETWORK` is the address with all host bits cleared: the address AND the netmask of the prefix.
4. `CLASS` depends on the address:
   - `loopback` in `127.0.0.0/8`;
   - `link-local` in `169.254.0.0/16`;
   - `private` in `10.0.0.0/8`, `172.16.0.0/12` or `192.168.0.0/16`;
   - `public` for everything else.

Example: `bash solution.sh data/ip-br-address.txt` prints

```text
lo 127.0.0.1/8 network 127.0.0.0/8 loopback
ens3 203.0.113.42/28 network 203.0.113.32/28 public
ens4 192.168.10.1/24 network 192.168.10.0/24 private
ens4 192.168.10.254/24 network 192.168.10.0/24 private
wg0 10.99.0.1/24 network 10.99.0.0/24 private
```

**Tips:** the lesson's Bash arithmetic turns an address into one number and back; the starter
already has `to_ip`. `${name%%@*}` removes everything from the first `@`, and `${cidr%/*}` and
`${cidr#*/}` split `ADDRESS/PREFIX`.
