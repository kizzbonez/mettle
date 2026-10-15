mkdir -p evidence
printf 'forensic image of laptop LT-CM-031 (Calder & Moss)\n' > evidence/EV-2026-0912-01.img
printf 'forensic image of USB stick serial 0401558f8a2c\n' > evidence/EV-2026-0912-02.img
printf 'memory dump of LT-CM-031 taken 2026-10-12 09:32 UTC\n' > evidence/EV-2026-0912-03.mem

actual=$(bash solution.sh data/manifest.sha256 data/custody.csv)
status=$?
assert_eq "$actual" "VERIFIED evidence/EV-2026-0912-01.img
VERIFIED evidence/EV-2026-0912-02.img
ALTERED evidence/EV-2026-0912-03.mem
MISSING evidence/EV-2026-0912-04.pcap
ORDER EV-2026-0912-03 at 2026-10-12 09:10
BREAK EV-2026-0912-02 at 2026-10-12 16:00: released by P. Grant, last held by D. Osei
SEAL EV-2026-0912-02 at 2026-10-13 08:10" \
  "integrity and custody lines for the example evidence, data/manifest.sha256 and data/custody.csv"
assert_eq "$status" "1" "exit status when evidence is altered or missing and the chain has gaps"
