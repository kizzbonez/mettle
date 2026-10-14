Complete `solution.sh`. It is run as `bash solution.sh HOSTS ANSWERS` and reports every name for
which `/etc/hosts` (what programs use first) disagrees with DNS (what `dig` shows).

1. **`HOSTS`** is a copy of `/etc/hosts`. `#` starts a comment anywhere on a line. Each remaining
   line is an address followed by one or more names. Ignore lines whose address contains `:`
   (IPv6). When a name is on several lines, the **first** line wins.
2. **`ANSWERS`** is the output of `dig +noall +answer NAME...`: lines `OWNER TTL CLASS TYPE DATA`,
   separated by spaces or tabs, with a `.` at the end of every name. Only `A` and `CNAME` records
   matter. A name's DNS addresses are the data of its `A` records, in answer order. A name with a
   `CNAME` record is an alias: its addresses are those of its target (which can be an alias too).
3. Compare names **without the final dot and ignoring letter case**, and print them in lower
   case.
4. Go through the owners of `A` and `CNAME` records in the order they first appear. When `HOSTS`
   gives an address for the name, the name has DNS addresses, and the hosts address is not one of
   them, print `NAME: /etc/hosts says ADDRESS, DNS says DNS_ADDRESSES`, with the DNS addresses
   separated by single spaces.
5. If nothing was printed, print `hosts and DNS agree`.

Example: `bash solution.sh data/hosts data/dig-answers.txt` prints

```text
db02.corp.example.com: /etc/hosts says 10.20.0.99, DNS says 10.20.0.14
www.corp.example.com: /etc/hosts says 10.20.0.15, DNS says 10.20.0.21 10.20.0.22
```

`www` is an alias of `web-lb`, which has two addresses. `ldap01` agrees, and `mail` and `web-lb`
are not in the hosts file.

**Tips:** read both files in one `awk` program, `HOSTS` first (`FNR == NR`). `sub(/#.*/, "")`
removes a comment and makes awk split the line again; `tolower` and `sub(/\.$/, "", name)` tidy
a name. Remember the order of the owners in an array indexed by number.
