actual=$(bash solution.sh data/inventory.csv data/discovery.csv data/certificates.csv)
status=$?
assert_eq "$actual" "MISSING HCL-0102 pc-central-02
RETIRED HCL-0077 lt-staff-077 at 10.30.4.66
UNCERTIFIED HCL-0078 lt-staff-078
UNCERTIFIED HCL-0081 nas-old-01
UNKNOWN 00:11:32:aa:bb:cc at 10.30.6.12 (NAS-BACKUP)" \
  "the findings for the inventory, discovery and certificates in data/"
assert_eq "$status" "1" "exit status when there are findings"
