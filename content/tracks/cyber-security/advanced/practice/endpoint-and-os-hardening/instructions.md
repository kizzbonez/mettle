Complete `solution.sh`. It is run as `bash solution.sh BASELINE DIR` and compares the kernel
settings that the files in `DIR` (a copy of `/etc/sysctl.d/`) apply with a baseline.

1. **The files.** Read every file in `DIR` whose name ends in `.conf`, in byte order of their
   names (`LC_ALL=C`), and ignore every other file. **The last value wins**, the opposite of
   `sshd_config`: a later line in a file overrides an earlier one, and a later file overrides an
   earlier file.
2. **The lines.** Skip blank lines and lines whose first non-space character is `#` or `;`. Every
   other line with an `=` is `KEY = VALUE`, with or without spaces or tabs around the `=`:
   - remove the spaces and tabs around `KEY` and `VALUE`;
   - a `-` in front of the key (meaning "ignore errors") is not part of it;
   - `/` in a key means the same as `.`: `net/ipv4/ip_forward` is `net.ipv4.ip_forward`.
   Lines without an `=` are skipped. The last line of a file may have no newline at its end.
3. **The baseline.** `BASELINE` has lines `KEY WANT DEFAULT` (separated by spaces; skip blank
   lines and `#` lines). For each key, in file order, the effective value is the last value the
   files set, or `DEFAULT` (the kernel's own value) when no file sets it. Print

   ```text
   STATUS KEY VALUE (SOURCE; baseline WANT)
   ```

   where `STATUS` is `PASS` when `VALUE` equals `WANT` as text, otherwise `FAIL`, and `SOURCE` is
   the name (without the folder) of the file that set the value, or `default`.
4. Exit with status 1 if any line is a `FAIL`, otherwise 0.

**Example.** `data/` holds the baseline and four files; `90-debug.conf.disabled` does not end in
`.conf`. `bash solution.sh data/sysctl-baseline.txt data` prints

```text
FAIL net.ipv4.ip_forward 1 (60-imaging-gateway.conf; baseline 0)
PASS net.ipv4.conf.all.accept_redirects 0 (50-hardening.conf; baseline 0)
FAIL net.ipv4.conf.all.send_redirects 1 (60-imaging-gateway.conf; baseline 0)
PASS net.ipv4.conf.all.rp_filter 1 (50-hardening.conf; baseline 1)
PASS net.ipv4.tcp_syncookies 1 (10-network-security.conf; baseline 1)
PASS kernel.kptr_restrict 2 (50-hardening.conf; baseline 2)
PASS kernel.dmesg_restrict 1 (50-hardening.conf; baseline 1)
PASS kernel.randomize_va_space 2 (default; baseline 2)
FAIL kernel.yama.ptrace_scope 0 (default; baseline 1)
```

and exits with status 1. `10-network-security.conf` sets `rp_filter` to 2, but
`50-hardening.conf` comes later and sets `net/ipv4/conf/all/rp_filter = 1`; the "temporary"
gateway file turns forwarding and redirects back on.

**Tips.** With `export LC_ALL=C` at the top, `for file in "$dir"/*.conf` visits the files in byte
order (add `shopt -s nullglob` for a folder without any). `${line%%=*}` and `${line#*=}` split a
line at its first `=`, `${key//\//.}` turns slashes into dots, and an associative array
(`declare -A value`) keeps the last value of each key.
