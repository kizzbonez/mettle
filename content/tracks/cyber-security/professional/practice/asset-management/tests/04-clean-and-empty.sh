cat > t4-inventory.csv <<'EOF'
asset_tag,hostname,mac,media,status
HCL-0401,pc-south-01,3c:52:82:4a:40:01,flash,in-service
HCL-0402,srv-south-01,52:54:00:00:40:02,magnetic,in-service
HCL-0403,lt-staff-403,3c:52:82:19:40:03,flash,disposed
EOF
cat > t4-discovery.csv <<'EOF'
ip,mac,name
10.30.7.11,3c:52:82:4a:40:01,pc-south-01
10.30.7.2,52:54:00:00:40:02,srv-south-01
EOF
cat > t4-certificates.csv <<'EOF'
record,asset_tag,method,technique,validated_by
SAN-2026-0401,HCL-0403,purge,crypto-erase,R. Alvarez
EOF

actual=$(bash solution.sh t4-inventory.csv t4-discovery.csv t4-certificates.csv)
status=$?
assert_eq "$actual" "inventory reconciled" "an inventory that matches discovery and certificates"
assert_eq "$status" "0" "exit status when there is nothing to report"

printf 'ip,mac,name\n' > t4-empty-discovery.csv
printf 'record,asset_tag,method,technique,validated_by\n' > t4-empty-certificates.csv
actual=$(bash solution.sh t4-inventory.csv t4-empty-discovery.csv t4-empty-certificates.csv)
status=$?
assert_eq "$actual" "MISSING HCL-0401 pc-south-01
MISSING HCL-0402 srv-south-01
UNCERTIFIED HCL-0403 lt-staff-403" "discovery and certificate files with only their header lines"
assert_eq "$status" "1" "exit status when there are findings"
