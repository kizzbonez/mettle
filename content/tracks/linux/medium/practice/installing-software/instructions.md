Write `solution.sh`. It is run as `bash solution.sh LISTING WANTED`, and the starter already
stores the two file names in `listing` and `wanted`. Either name may contain spaces. Nothing is
installed or removed: the script only reads the two files.

1. `LISTING` is the saved output of `dpkg -l`: five header lines, then one row per package. A row
   starts with the status letters, then the package name, the version, the architecture and a
   description of several words. Only a row whose status is exactly `ii` is an installed package;
   `rc` (removed, configuration left behind) and every other status mean "not installed".
2. `WANTED` has one pinned package per line, `NAME VERSION`. Skip blank lines (empty, or only
   spaces) and lines whose first character is `#`. Every line counts, including a last line with no newline after it.
3. For each package in `WANTED`, in order, print one line:
   - `NAME: ok` when an installed row has exactly this name and exactly this version;
   - `NAME: INSTALLED installed, VERSION wanted` when an installed row has this name but another
     version;
   - `NAME: not installed` when no installed row has exactly this name. `python3-minimal` is not
     `python3`.
4. Then print `problems: N`, the number of packages that were not `ok`, and exit with status `1`
   if `N` is more than `0`, or `0` otherwise.

For the sample files (`bash solution.sh data/dpkg-l.txt data/wanted.txt`) the output is:

```text
gawk: ok
jq: 1.6-2.1 installed, 1.7.1-3 wanted
nginx: not installed
curl: ok
python3: ok
problems: 2
```

and the exit status is `1`. `nginx` has a row, but its status is `rc`.

**Tips.**
- Read `WANTED` with `while read -r name version || [ -n "$name" ]; do ... done < "$wanted"`.
- For each name, one awk command can find the version: compare the first field with `"ii"` and
  the second with the name, passed in with `-v`. Comparing with `==` matches the whole field,
  which `grep` does not do on its own.
- Versions such as `1:5.2.1-2` contain a colon (the epoch); compare them as whole strings.
