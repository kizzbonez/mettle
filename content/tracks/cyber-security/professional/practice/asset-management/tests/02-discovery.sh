cat > t2-inventory.csv <<'EOF'
asset_tag,hostname,mac,media,status
HCL-0201,pc-west-01,3C:52:82:4A:30:01,flash,in-service
HCL-0202,pc-west-02,3c:52:82:4a:30:02,flash,in-service

HCL-0203,pc-west-03,3c:52:82:4a:30:03,flash,in-repair
HCL-0204,pc-west-04,3c:52:82:4a:30:04,flash,in-repair
HCL-0205,kiosk-west-01,B8:27:EB:00:00:05,flash,disposed

EOF
cat > t2-discovery.csv <<'EOF'
ip,mac,name
10.30.3.21,3c:52:82:4a:30:01,pc-west-01

10.30.3.24,3C:52:82:4A:30:04,pc-west-04
10.30.3.50,b8:27:eb:00:00:05,kiosk-west-01
10.30.3.50,b8:27:eb:00:00:05,kiosk-west-01
10.30.3.99,DC:A6:32:0F:1E:2D,raspberrypi
10.30.3.99,dc:a6:32:0f:1e:2d,raspberrypi
EOF
cat > t2-certificates.csv <<'EOF'
record,asset_tag,method,technique,validated_by
SAN-2026-0201,HCL-0205,destroy,shred,K. Mensah
EOF

actual=$(bash solution.sh t2-inventory.csv t2-discovery.csv t2-certificates.csv)
status=$?
assert_eq "$actual" "MISSING HCL-0202 pc-west-02
RETIRED HCL-0205 kiosk-west-01 at 10.30.3.50
UNKNOWN dc:a6:32:0f:1e:2d at 10.30.3.99 (raspberrypi)" \
  "MACs in mixed case, duplicate discovery rows, blank lines and in-repair assets seen or not"
assert_eq "$status" "1" "exit status when there are findings"
