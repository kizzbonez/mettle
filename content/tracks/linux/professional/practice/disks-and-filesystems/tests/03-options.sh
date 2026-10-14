cat > blkid.txt <<'EOF'
/dev/sdb1: LABEL="dicom" UUID="5f0a9c3e-2d71-4b84-9e6a-c1b8d3f2e047" BLOCK_SIZE="4096" TYPE="xfs" PARTUUID="8c3e1a5f-7b92-4d06-a4e1-6f0b2c9d7a38"
EOF
cat > fstab.txt <<'EOF'
LABEL=usb-backup   /mnt/usb      ext4     nofail,noatime                                   0  2
LABEL=usb-backup2  /mnt/usb2     ext4     noatime,nofail                                   0  2
LABEL=offsite      /mnt/offsite  ext4     rw,x-systemd.device-timeout=10s,nofail,noexec    0  2
LABEL=manual       /mnt/manual   ext4     noauto,user                                      0  0
LABEL=dvd          /media/dvd    iso9660  ro,user,noauto                                   0  0
LABEL=archive      /srv/archive  xfs      defaults,noatime                                 0  2
LABEL=dicom        /srv/dicom    ext4     defaults,nofail                                  0  2
EOF
assert_eq "$(bash solution.sh fstab.txt blkid.txt)" "/srv/archive: LABEL=archive not found, boot would stop
/srv/dicom: fstab says ext4, device has xfs" \
  "nofail and noauto anywhere in the options, and a wrong type on a disk with nofail"
