cat > blkid.txt <<'EOF'
/dev/nvme0n1p1: UUID="2C4F-8A1B" BLOCK_SIZE="512" TYPE="vfat" PARTUUID="6a1d3f0b-92c4-4e7a-b815-0d3c7e9f2a41"
/dev/nvme0n1p2: UUID="b83e0f6d-1c2a-4975-8e4b-7a6d2c1f0e93" BLOCK_SIZE="4096" TYPE="ext4" PARTUUID="f0c2a9e1-5b7d-4386-9a14-2e8b6d0c4f75"
/dev/mapper/data-pacs: UUID="91d7e2c4-3a5f-4b08-8c6e-0f2a7d9b1e53" BLOCK_SIZE="4096" TYPE="xfs"
/dev/sdc1: UUID="4e6a8c0d-2f1b-4d3e-a5c7-9b0e1f3a5c7d" BLOCK_SIZE="4096" TYPE="ext4" PARTUUID="0e2c4a6b-8d1f-4a3c-9e5b-7d9f1b3d5f70"
EOF
cat > fstab.txt <<'EOF'
/dev/nvme0n1p2                 /           ext4   errors=remount-ro  0  1
/dev/disk/by-uuid/2C4F-8A1B    /boot/efi   vfat   umask=0077         0  1
/dev/mapper/data-pacs          /srv/pacs   xfs    defaults,nosuid    0  2
/dev/sdd1                      /mnt/old    ext4   defaults           0  2
/dev/sdc1                      /mnt/spare  ext4   defaults,nofail    0  2
proc                           /proc       proc   defaults           0  0
nas01:/export/scans            /mnt/scans  nfs    defaults,_netdev   0  0
tmpfs                          /run/shm    tmpfs  defaults,noexec    0  0
EOF
assert_eq "$(bash solution.sh fstab.txt blkid.txt)" "/: device name /dev/nvme0n1p2 can change, use UUID= or LABEL=
/mnt/old: device name /dev/sdd1 can change, use UUID= or LABEL=
/mnt/old: /dev/sdd1 not found, boot would stop
/mnt/spare: device name /dev/sdc1 can change, use UUID= or LABEL=" \
  "device names, stable /dev/mapper and /dev/disk paths, and sources that are not disks"

cat > clean.txt <<'EOF'
# /etc/fstab of a rebuilt server

UUID=b83e0f6d-1c2a-4975-8e4b-7a6d2c1f0e93   /          ext4  errors=remount-ro  0  1
	/dev/mapper/data-pacs   /srv/pacs  xfs  defaults  0  2
   # tmpfs /tmp tmpfs defaults 0 0
EOF
assert_eq "$(bash solution.sh clean.txt blkid.txt)" "fstab ok" "an fstab without problems, with indented lines and comments"
