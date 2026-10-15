Complete `solution.sh`. It is run as `bash solution.sh MANIFEST CUSTODY`.

1. **Integrity.** `MANIFEST` is in `sha256sum` format: `HASH  FILE` (two spaces), where `FILE`
   may contain spaces. Skip empty lines and lines starting with `#`. For each line, in order,
   print:
   - `VERIFIED FILE` when the file's SHA-256 hash equals `HASH`;
   - `ALTERED FILE` when the file exists but its hash differs;
   - `MISSING FILE` when the file does not exist.
2. **Chain of custody.** `CUSTODY` is a CSV file with the header
   `item,time,released_by,received_by,purpose,seal`; skip the header and empty lines. Times are
   `YYYY-MM-DD HH:MM` in UTC. Read the rows in file order; the rows of different items are
   mixed. For each item, the holder before its first row is `-`, and each row hands the item
   from `released_by` to `received_by`. For each row, print in this order:
   - `ORDER ITEM at TIME` when its time is earlier than the time of the item's previous row;
   - `BREAK ITEM at TIME: released by NAME, last held by HOLDER` when `released_by` is not the
     item's current holder (the previous row's `received_by`, or `-`);
   - `SEAL ITEM at TIME` when `seal` is not `yes`.

   The row then becomes the item's previous row: its time, and `received_by` as the holder.
3. Print all the integrity lines first, then the custody lines. Exit with status 0 when every
   file is `VERIFIED` and there is no custody line; otherwise exit with status 1.

**Example.** The test first writes the evidence files:

```bash
mkdir -p evidence
printf 'forensic image of laptop LT-CM-031 (Calder & Moss)\n' > evidence/EV-2026-0912-01.img
printf 'forensic image of USB stick serial 0401558f8a2c\n' > evidence/EV-2026-0912-02.img
printf 'memory dump of LT-CM-031 taken 2026-10-12 09:32 UTC\n' > evidence/EV-2026-0912-03.mem
```

Then `bash solution.sh data/manifest.sha256 data/custody.csv` prints the following and exits
with status 1:

```text
VERIFIED evidence/EV-2026-0912-01.img
VERIFIED evidence/EV-2026-0912-02.img
ALTERED evidence/EV-2026-0912-03.mem
MISSING evidence/EV-2026-0912-04.pcap
ORDER EV-2026-0912-03 at 2026-10-12 09:10
BREAK EV-2026-0912-02 at 2026-10-12 16:00: released by P. Grant, last held by D. Osei
SEAL EV-2026-0912-02 at 2026-10-13 08:10
```

One changed character in the memory dump changes its whole hash. The USB stick passed from
D. Osei to F. Ruiz through a P. Grant nobody recorded receiving it, and came back with a broken
seal.

**Tips:** `read -r hash file` puts everything after the hash into `file`, and
`sha256sum "$file" | cut -d' ' -f1` gives a file's hash. `IFS=, read -r item time released
received purpose seal` splits a custody row; associative arrays (`declare -A holder last`) keep
each item's holder and time, and `[[ $a < $b ]]` compares two times as text.
