actual=$(bash solution.sh 2026-10-16 data/inventory.csv)
status=$?
assert_eq "$actual" "pms-02: unsupported unpatched
guest-wifi-ctl: unpatched unmanaged exposed:22
kiosk-lobby-1: no-owner
lock-server: unknown-os unpatched unmanaged no-owner
door-vnc-pc: unsupported unpatched exposed:3389 exposed:5900
ops-jump: exposed:22
6 of 8 hosts need action" "findings for data/inventory.csv on 2026-10-16"
assert_eq "$status" "1" "exit status when hosts need action"
