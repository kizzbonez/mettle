Complete `solution.sh`. It is run as `bash solution.sh INVENTORY DISCOVERY CERTIFICATES`, three
CSV files that each start with a header line. Skip the headers and any empty lines.

- `INVENTORY`: `asset_tag,hostname,mac,media,status`. `media` is `flash` or `magnetic`;
  `status` is `in-service`, `in-repair` or `disposed`.
- `DISCOVERY`, what the DHCP leases and switch tables saw: `ip,mac,name`.
- `CERTIFICATES`, the certificates of sanitization: `record,asset_tag,method,technique,validated_by`.

MAC addresses match whatever their case; always print them in lower case.

1. **Discovery.** Print one line for each of these:
   - `UNKNOWN MAC at IP (NAME)` for a discovery row whose MAC is not in the inventory;
   - `RETIRED TAG HOSTNAME at IP` for a discovery row whose MAC belongs to a `disposed` asset;
   - `MISSING TAG HOSTNAME` for an `in-service` asset whose MAC is in no discovery row. An
     `in-repair` asset is never missing, and nothing is printed when one is seen.
2. **Certificates.** Print `UNCERTIFIED TAG HOSTNAME` for each `disposed` asset that has no
   acceptable certificate. A certificate is acceptable for an asset when its `asset_tag` is the
   asset's tag, its `method` is `purge` or `destroy` (`clear` is not enough for a device that
   leaves the library), its `validated_by` is not empty, and it is not a `purge` whose
   `technique` is `overwrite` or `degauss` on `flash` media (wear leveling defeats overwriting,
   and degaussing does nothing to flash). One acceptable certificate is enough.
3. **Output.** Print all the lines sorted in byte order (`LC_ALL=C sort`), each distinct line
   once (discovery can list a device twice), and exit with status 1. If there is no line at all,
   print `inventory reconciled` and exit with status 0.

**Example.** `bash solution.sh data/inventory.csv data/discovery.csv data/certificates.csv`
prints the following and exits with status 1:

```text
MISSING HCL-0102 pc-central-02
RETIRED HCL-0077 lt-staff-077 at 10.30.4.66
UNCERTIFIED HCL-0078 lt-staff-078
UNCERTIFIED HCL-0081 nas-old-01
UNKNOWN 00:11:32:aa:bb:cc at 10.30.6.12 (NAS-BACKUP)
```

`HCL-0077` has a good certificate, yet it still answers on the network, so the disposal failed
somewhere. `HCL-0078` was "purged" by overwriting its flash drive, and nobody validated the
shredding of `HCL-0081`. `pc-east-03` is in repair, so not seeing it is expected.

**Tips:** one `awk -F,` program can read all three files, as in the lesson; in gawk, `ARGIND` is
1, 2 or 3 for the file being read. `tolower` normalizes a MAC, and `if (key in array)` tests
membership.
