actual=$(bash solution.sh data/fstab data/blkid)
assert_eq "$actual" "/var: fstab says ext4, device has xfs
/srv/data: device name /dev/vdb1 can change, use UUID= or LABEL=
/srv/scratch: UUID=a7f3c2d1-5e8b-4c9a-b0d6-3e1f2a4b5c6d not found, boot would stop
/srv/media: fstab says xfs, device has ext4" "problems in data/fstab compared with data/blkid"
