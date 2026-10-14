Complete `solution.sh`. It is run as `bash solution.sh DIR BASELINE` and compares the setuid and
setgid files under `DIR` with a list saved earlier.

1. **Now.** Find every **regular file** under `DIR` with the setuid or the setgid bit set (or
   both). Its mode is the octal number `find -printf '%m'` prints, such as `4755`, and its path
   is what `find DIR` prints (it starts with `DIR`).
2. **Before.** `BASELINE` has one `MODE PATH` line per file, in the same form. Skip empty lines
   and lines starting with `#`. Paths may contain spaces.
3. **Print the differences**, first all `new` lines, then all `changed`, then all `gone`, each
   group sorted by path in byte order (`LC_ALL=C sort`):
   - `new: PATH (MODE)` for a file found now that is not in the baseline;
   - `changed: PATH (OLD -> NEW)` for a file in both whose mode differs;
   - `gone: PATH` for a file in the baseline that is not found now.
4. If there is no difference, print `no changes` and exit with status 0. Otherwise exit with
   status 1.

Example: the test first builds this tree, then runs `bash solution.sh fs data/suid-baseline.txt`:

```bash
mkdir -p fs/usr/bin fs/usr/sbin fs/tmp/.cache
touch fs/usr/bin/{passwd,chsh,su,mount,chage} fs/usr/sbin/unix_chkpwd fs/tmp/.cache/bash
chmod 4755 fs/usr/bin/passwd fs/usr/bin/chsh fs/tmp/.cache/bash
chmod 6755 fs/usr/bin/su
chmod 0755 fs/usr/bin/mount
chmod 2755 fs/usr/bin/chage fs/usr/sbin/unix_chkpwd
```

It prints the following and exits with status 1:

```text
new: fs/tmp/.cache/bash (4755)
changed: fs/usr/bin/su (4755 -> 6755)
gone: fs/usr/bin/mount
```

**Tips:** `find "$dir" -type f -perm /6000 -printf '%m %p\n'` lists the files now. `read -r mode
path` puts everything after the first space into `path`. An associative array
(`declare -A before`) maps each path to its mode, and `[ -n "${before[$path]+set}" ]` tests
whether a path is in it.
