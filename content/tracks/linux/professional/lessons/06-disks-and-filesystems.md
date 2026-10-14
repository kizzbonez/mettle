---
title: Disks and Filesystems
summary: Find the block devices and partitions of a machine, create and mount a filesystem, make the mount permanent in /etc/fstab without risking the next boot, find what is filling a disk, and check a damaged filesystem.
minutes: 30
objectives:
  - Identify disks, partitions and filesystems with `lsblk` and `blkid`, and explain MBR and GPT
  - Create a filesystem, mount it, and add a safe `/etc/fstab` entry using its UUID
  - Find what fills a disk with `df` and `du`, including inode exhaustion and deleted open files
  - Check and repair a filesystem with `fsck` or `xfs_repair` on an unmounted device
---

## Outline

1. Block devices and partitions
2. Filesystems
3. Mounting and /etc/fstab
4. What is filling the disk?
5. Checking a filesystem

## Block devices and partitions

A **block device** is storage the kernel reads and writes in fixed-size blocks: a disk, an SSD,
a USB stick, a virtual disk. Each appears as a file in `/dev`: SATA and SCSI disks as `/dev/sda`,
`/dev/sdb`; NVMe drives as `/dev/nvme0n1`; virtual machine disks often as `/dev/vda`. A disk is
divided into **partitions**, numbered `/dev/sda1` or `/dev/nvme0n1p1`. `lsblk` shows the tree
without needing root; this is a typical virtual server:

```bash
lsblk -f
```

```text
NAME          FSTYPE      FSVER    LABEL UUID                                   FSAVAIL FSUSE% MOUNTPOINTS
vda
├─vda1        vfat        FAT32          3C1A-9F02                               505.9M     1% /boot/efi
├─vda2        ext4        1.0            9b2d6c1e-4a7f-4e33-a0f1-5d2c8e7b1a90      1.5G    16% /boot
└─vda3        LVM2_member LVM2 001       Zp3x1Q-...
  ├─vg0-root  ext4        1.0            1f0e7c55-2b8d-4c61-9d3e-7a4b2c9e8f10      9.6G    62% /
  └─vg0-var   xfs                        6c8a2e41-0d9b-4f7a-b3c5-2e1f9d8a7c66      1.3G    94% /var
vdb
```

`vdb` is a second disk with no partitions yet. `vg0-root` and `vg0-var` are **logical volumes**:
LVM, the Logical Volume Manager, pools partitions into a volume group and carves resizable
volumes out of it, which is why they sit under `vda3`.

The **partition table** at the start of the disk records where partitions begin and end. The
old **MBR** scheme allows four primary partitions (one of which can be an "extended" partition
holding logical ones) and cannot address more than 2 TiB. **GPT**, part of the UEFI standard,
allows 128 partitions by default, handles huge disks, and keeps a backup copy of its table at
the end of the disk. Use GPT for anything new. `fdisk` edits both kinds, `gdisk` is a GPT
specialist, and `parted` works on both and can be scripted. All of them can destroy every byte
on the disk with one wrong device name: check with `lsblk` twice, and never repartition a disk
that is in use.

## Filesystems

A partition is just space. A **filesystem** organises it into files and directories, with
**inodes**, the records that hold each file's owner, permissions and the location of its data.
The common choices: **ext4**, the long-standing default on Debian and Ubuntu; **XFS**, the Red
Hat default, strong with large files and parallel writes, but unable to shrink; **Btrfs**, with
snapshots, subvolumes, transparent compression and several devices in one filesystem; **vfat**
and **exFAT** for EFI partitions and removable media shared with other systems. **Swap** is
space the kernel uses to move memory pages out of RAM; it is prepared with `mkswap` and turned
on with `swapon`.

`mkfs.<type>` (or `mkfs -t <type>`) creates a filesystem and **erases what was there**. For the
empty disk above, on a typical system:

```bash
sudo parted /dev/vdb --script mklabel gpt mkpart data ext4 1MiB 100%
sudo mkfs.ext4 -L data /dev/vdb1
sudo blkid /dev/vdb1
```

```text
/dev/vdb1: LABEL="data" UUID="e3f1a0c2-7b5d-4e8a-9c21-0d6f4b3a2e11" BLOCK_SIZE="4096" TYPE="ext4" PARTLABEL="data" PARTUUID="0b6e2d4f-9a17-4c3e-8f52-1d7a6c9e4b30"
```

Every filesystem gets a **UUID**, a unique identifier written inside it, and can get a
**label** (`-L`). `tune2fs -l /dev/vdb1` prints the settings of an ext filesystem, and
`tune2fs -L` or `e2label` changes the label later.

## Mounting and /etc/fstab

Linux has one directory tree. **Mounting** attaches a filesystem at a directory, the **mount
point**; whatever the directory contained before is hidden until it is unmounted.

```bash
sudo mkdir -p /srv/data
sudo mount /dev/vdb1 /srv/data
findmnt /srv/data
sudo umount /srv/data
```

```text
TARGET    SOURCE    FSTYPE OPTIONS
/srv/data /dev/vdb1 ext4   rw,relatime
```

`umount` fails with "target is busy" while any process has a file open there or a shell has
its working directory inside; `sudo lsof /srv/data` names them. Stop those processes or
`cd` out, then try again.

A mount made by hand is gone after a reboot. `/etc/fstab` lists what to mount at boot, one line
per filesystem with six fields: what, where, type, options, dump, and fsck order:

```text
# <file system>                            <mount point> <type> <options>          <dump> <pass>
UUID=1f0e7c55-2b8d-4c61-9d3e-7a4b2c9e8f10  /             ext4   errors=remount-ro  0      1
UUID=e3f1a0c2-7b5d-4e8a-9c21-0d6f4b3a2e11  /srv/data     ext4   defaults,nofail    0      2
UUID=7d4c...                               none          swap   sw                 0      0
```

Use `UUID=` or `LABEL=`, never `/dev/vdb1`: device names are assigned in the order disks are
found and can change when one is added. The last field orders `fsck` at boot: 1 for the root
filesystem, 2 for others, 0 for none. Useful options: `defaults` (read-write, normal
behaviour), `ro`, `noexec`, `nosuid` and `nodev` (no programs, no setuid, no device files:
good for data and upload directories), `noauto` (do not mount at boot), and `nofail`.

A mistake in fstab can stop the next boot in **emergency mode**, so test before rebooting: run
`sudo findmnt --verify`, then `sudo systemctl daemon-reload` (systemd turns fstab into mount
units), then `sudo mount -a`, which mounts everything listed that is not mounted yet and shows
any error now, while you can still fix it. Add `nofail` to disks that are not needed to boot,
such as a USB backup drive.

## What is filling the disk?

`df -h` reports each mounted filesystem's size and use; `df -i` reports **inodes**. A filesystem
can be "full" with free space left if millions of tiny files have used every inode. To find
where the space went, `du` adds up file sizes under a directory:

```bash
du -h --max-depth=1 logs | sort -rh
```

```text
43M	logs
31M	logs/app
13M	logs/old
```

Work down from the largest directory; `du -xh --max-depth=1 /` with `-x` stays on one
filesystem. `du` counts blocks actually used, which is not always the size `ls` shows. A
**sparse** file has holes that use no disk:

```bash
truncate -s 1G sparse.img
ls -lh sparse.img; du -h sparse.img; du -h --apparent-size sparse.img
```

```text
-rw-r--r-- 1 sandbox sandbox 1.0G Oct 14 11:17 sparse.img
0	sparse.img
1.0G	sparse.img
```

The opposite surprise is common in incidents: `df` says 100% but `du` finds far less. A process
still has a **deleted** file open, usually a log removed with `rm` instead of rotated, and the
space is only freed when the file is closed. `sudo lsof +L1` lists open files with no remaining
name; restart that service, or truncate the file through `/proc/<pid>/fd/<n>`.

## Checking a filesystem

A power cut or a failing disk can leave a filesystem inconsistent. `fsck` is a front end that
runs the right checker, such as `e2fsck` for ext4; XFS is repaired with `xfs_repair` instead.
**Never run a repair on a mounted read-write filesystem**: the checker and the kernel would
both change the same structures, and the result can be worse than the original damage. Unmount
it first, or for the root filesystem boot into rescue mode. Start with a read-only look:

```bash
sudo umount /srv/data
sudo e2fsck -n /dev/vdb1      # -n: report only, answer "no" to every repair
sudo e2fsck -f -p /dev/vdb1   # -f: force a full check, -p: fix what is safe automatically
```

`fsck` exit codes add up: 0 means clean, 1 errors corrected, 4 errors left uncorrected. Take a
copy of a disk with important data before letting a repair tool loose on it.

## Common mistakes

- Running `mkfs` or `fdisk` on the wrong device name. Read `lsblk` twice first.
- `/dev/sdX` names in fstab, which change when hardware changes.
- Rebooting after editing fstab without `findmnt --verify` and `mount -a`.
- Deleting a log that a process still writes to, and wondering why `df` does not change.
- Running `fsck` on a mounted filesystem.
- Forgetting inodes when `df -h` shows space but writes fail with "No space left on device".

## Practice

1. `df -h` shows `/var` at 100%, but `du -sh /var` reports 40% of its size. What is the likely cause and how do you confirm it?
2. Write an fstab line that mounts the filesystem labelled `backup` at `/mnt/backup`, read-only, without failing the boot if the drive is absent.
3. Writes to `/srv/cache` fail with "No space left on device" but `df -h` shows 30% used. What do you check?

### Answers

1. A deleted file that a process still holds open. `sudo lsof +L1` shows it with its PID;
   restarting that service (or rotating its logs properly) frees the space.
2. `LABEL=backup /mnt/backup ext4 ro,nofail 0 2` (with the right type). Test it with
   `findmnt --verify` and `mount -a` before rebooting.
3. `df -i /srv/cache`. All inodes are probably used by many small files; delete or archive them,
   or recreate the filesystem with more inodes.

## Key takeaways

- `lsblk -f` shows disks, partitions, filesystems, UUIDs and mount points at a glance.
- Use GPT for new disks, and check the device name twice before any partitioning or `mkfs`.
- Mount by `UUID=` or `LABEL=` in fstab, and test with `findmnt --verify` and `mount -a`.
- `df` for filesystems, `df -i` for inodes, `du` to find the directory responsible.
- Repair only unmounted filesystems, starting with a read-only check.

## Further reading

- [fstab(5) manual page](https://man7.org/linux/man-pages/man5/fstab.5.html)
- [lsblk(8) manual page](https://man7.org/linux/man-pages/man8/lsblk.8.html)
- [e2fsck(8) manual page](https://man7.org/linux/man-pages/man8/e2fsck.8.html)
- [mount(8) manual page](https://man7.org/linux/man-pages/man8/mount.8.html)
