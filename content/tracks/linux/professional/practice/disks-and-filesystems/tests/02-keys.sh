cat > blkid.txt <<'EOF'
/dev/sda1: SEC_TYPE="msdos" LABEL_FATBOOT="EFI" LABEL="EFI" UUID="7A3B-11C4" BLOCK_SIZE="512" TYPE="vfat" PARTLABEL="EFI System Partition" PARTUUID="9d2f7c1a-4b6e-4e02-a8f3-5c1d0b7e2a96"
/dev/sda2: UUID="c41e8f02-6b3d-4a9e-8d17-2f5a0c9b3e68" BLOCK_SIZE="4096" TYPE="ext4" PARTLABEL="images" PARTUUID="1e7b4d93-0c2a-4f58-b6e9-3a8d5c2f1b07"
/dev/sdb1: LABEL="dicom" UUID="5f0a9c3e-2d71-4b84-9e6a-c1b8d3f2e047" BLOCK_SIZE="4096" TYPE="xfs" PARTUUID="8c3e1a5f-7b92-4d06-a4e1-6f0b2c9d7a38"
EOF
cat > fstab.txt <<'EOF'
UUID=7A3B-11C4                             /boot/efi     vfat  umask=0077  0  1
LABEL=EFI                                  /boot/efi2    vfat  umask=0077  0  1
UUID=1e7b4d93-0c2a-4f58-b6e9-3a8d5c2f1b07  /srv/images   ext4  defaults    0  2
LABEL=images                               /srv/images2  ext4  defaults    0  2
LABEL=dicom                                /srv/dicom    xfs   defaults    0  2
UUID=c41e8f02-6b3d-4a9e-8d17               /srv/partial  ext4  defaults    0  2
UUID=c41e8f02-6b3d-4a9e-8d17-2f5a0c9b3e68  /srv/cache    auto  defaults    0  2
EOF
assert_eq "$(bash solution.sh fstab.txt blkid.txt)" "/srv/images: UUID=1e7b4d93-0c2a-4f58-b6e9-3a8d5c2f1b07 not found, boot would stop
/srv/images2: LABEL=images not found, boot would stop
/srv/partial: UUID=c41e8f02-6b3d-4a9e-8d17 not found, boot would stop" \
  "UUID, LABEL and TYPE told apart from PARTUUID, PARTLABEL, SEC_TYPE and LABEL_FATBOOT, whole values only, and type auto"
