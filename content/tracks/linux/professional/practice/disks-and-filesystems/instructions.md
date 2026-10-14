Complete `solution.sh`. It is run as `bash solution.sh FSTAB BLKID`, where `FSTAB` is a copy of
`/etc/fstab` and `BLKID` the output of `sudo blkid` on the same machine.

`BLKID` has one line per device: `DEVICE: KEY="value" KEY="value" ...`. The keys that matter are
`UUID`, `LABEL` and `TYPE`; do not confuse them with `PARTUUID`, `PARTLABEL` and `SEC_TYPE`.

Check every line of `FSTAB` that is not empty or a comment (first non-blank character `#`). Its
fields are source, mount point, type, options (comma-separated), dump and pass. Print the
problems in file order, each starting with the mount point:

1. A source that starts with `/dev/` but not with `/dev/mapper/` or `/dev/disk/` is a device name,
   which can change: print `MOUNT: device name SOURCE can change, use UUID= or LABEL=`.
2. Find the device of the source: `UUID=X` is the device whose `UUID` is exactly `X`, `LABEL=X`
   the one whose `LABEL` is exactly `X`, and a `/dev/` source (other than `/dev/disk/...`) the
   device of that name. Any other source (`tmpfs`, `proc`, `nas01:/export`, `/dev/disk/...`) is
   not checked further.
3. If there is no such device and the options contain neither `nofail` nor `noauto`, print
   `MOUNT: SOURCE not found, boot would stop`.
4. If there is a device, and the fstab type is not `auto` and differs from the device's `TYPE`,
   print `MOUNT: fstab says FSTAB_TYPE, device has TYPE`.

If there is no problem at all, print `fstab ok`.

Example: `bash solution.sh data/fstab data/blkid` prints

```text
/var: fstab says ext4, device has xfs
/srv/data: device name /dev/vdb1 can change, use UUID= or LABEL=
/srv/scratch: UUID=a7f3c2d1-5e8b-4c9a-b0d6-3e1f2a4b5c6d not found, boot would stop
/srv/media: fstab says xfs, device has ext4
```

The backup disk (`LABEL=backup`) is missing too, but it has `nofail`.

**Tips:** read both files in one `awk` program, `BLKID` first (`FNR == NR`). With a leading
space in the pattern, `match(line, / UUID="[^"]*"/)` finds the key `UUID` and not `PARTUUID`;
`RSTART` and `RLENGTH` then give its place in the line.
