cat > t3-inventory.csv <<'EOF'
asset_tag,hostname,mac,media,status
HCL-0301,lt-staff-301,3c:52:82:19:30:01,flash,disposed
HCL-0302,lt-staff-302,3c:52:82:19:30:02,flash,disposed
HCL-0303,srv-old-303,52:54:00:00:30:03,magnetic,disposed
HCL-0304,lt-staff-304,3c:52:82:19:30:04,flash,disposed
HCL-0305,nas-old-305,00:11:32:00:30:05,magnetic,disposed
HCL-0306,lt-staff-306,3c:52:82:19:30:06,flash,disposed
HCL-0307,lt-staff-307,3c:52:82:19:30:07,flash,disposed
HCL-0309,srv-old-309,52:54:00:00:30:09,magnetic,disposed
HCL-0308,pc-main-308,3c:52:82:19:30:08,flash,in-service
EOF
cat > t3-discovery.csv <<'EOF'
ip,mac,name
10.30.5.8,3c:52:82:19:30:08,pc-main-308
EOF
cat > t3-certificates.csv <<'EOF'
record,asset_tag,method,technique,validated_by
SAN-2026-0301,HCL-0301,purge,degauss,R. Alvarez
SAN-2026-0302,HCL-0302,purge,overwrite,R. Alvarez
SAN-2026-0303,HCL-0302,purge,sanitize,R. Alvarez
SAN-2026-0304,HCL-0303,purge,degauss,R. Alvarez

SAN-2026-0305,HCL-0304,clear,overwrite,R. Alvarez
SAN-2026-0306,HCL-0305,destroy,shred,
SAN-2026-0307,HCL-0306,destroy,disintegrate,K. Mensah
SAN-2026-0308,HCL-0399,purge,crypto-erase,K. Mensah
SAN-2026-0309,HCL-0308,clear,overwrite,K. Mensah
SAN-2026-0310,HCL-0309,purge,overwrite,K. Mensah
EOF

actual=$(bash solution.sh t3-inventory.csv t3-discovery.csv t3-certificates.csv)
status=$?
assert_eq "$actual" "UNCERTIFIED HCL-0301 lt-staff-301
UNCERTIFIED HCL-0304 lt-staff-304
UNCERTIFIED HCL-0305 nas-old-305
UNCERTIFIED HCL-0307 lt-staff-307" \
  "which disposed assets have an acceptable certificate: method, validator, flash techniques, several certificates per asset"
assert_eq "$status" "1" "exit status when assets are uncertified"
