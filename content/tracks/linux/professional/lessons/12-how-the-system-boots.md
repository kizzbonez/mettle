---
title: How the System Boots
summary: Follow a Linux machine from power-on through firmware, boot loader, kernel and initramfs to systemd and its targets, read the logs of a boot, shut down cleanly, and recover a system that will not start.
minutes: 30
objectives:
  - Name the stages of the boot process in order and say what each one hands to the next
  - Change kernel parameters for one boot from the GRUB menu, and permanently in `/etc/default/grub`
  - Read the logs and timing of the current and previous boots with `journalctl` and `systemd-analyze`
  - Choose between rescue and emergency mode and repair a broken `/etc/fstab`
---

## Outline

1. The chain of handovers
2. Firmware
3. The boot loader
4. The kernel and the initramfs
5. systemd, targets and shutting down
6. Reading a boot
7. When it does not boot

## The chain of handovers

Booting is a relay. Each stage does a little work and hands over to a larger program:
**firmware** finds a boot loader, the **boot loader** loads the kernel and the initramfs, the
**kernel** sets up the hardware and starts a temporary root filesystem, the **initramfs** finds
and mounts the real root filesystem, and **systemd** starts everything else. Knowing the chain
tells you where to look when a machine stops partway, and what the last message on the screen
means.

## Firmware

The **firmware** is the program stored on the motherboard that runs at power-on. It tests the
hardware (the power-on self test) and chooses a boot device from its boot order. Older PCs use
**BIOS**, which loads the first 512-byte sector of a disk, the MBR, and runs the tiny boot code
there. Current machines use **UEFI**, which reads a FAT-formatted **EFI system partition**
(usually mounted at `/boot/efi`) and runs a boot program file from it, such as
`\EFI\debian\grubx64.efi` or `shimx64.efi`. UEFI keeps its boot entries in firmware variables
(`efibootmgr` lists them) and can enforce **Secure Boot**, which only runs boot loaders and
kernels signed with trusted keys.

## The boot loader

**GRUB 2** is the usual boot loader on servers; `systemd-boot` is a simpler alternative on UEFI
machines. GRUB shows a menu of kernels, loads the chosen kernel and its initramfs into memory,
and passes the **kernel command line**, a list of parameters such as which device holds the
root filesystem.

Its configuration file, `/boot/grub/grub.cfg` (`/boot/grub2/grub.cfg` on Red Hat), is
**generated**; never edit it, because the next kernel update rewrites it. Change
`/etc/default/grub` instead and regenerate:

```bash
grep -E '^GRUB_(TIMEOUT|CMDLINE_LINUX_DEFAULT)=' /etc/default/grub
sudo update-grub          # Debian, Ubuntu: runs grub-mkconfig -o /boot/grub/grub.cfg
```

```text
GRUB_TIMEOUT=5
GRUB_CMDLINE_LINUX_DEFAULT="quiet"
```

On Red Hat systems the regeneration command is `grub2-mkconfig -o /boot/grub2/grub.cfg`. For a
**single boot**, press `e` at the GRUB menu, edit the line that starts with `linux`, and press
`Ctrl+X` or `F10` to boot with it. Nothing is saved, which makes this the safe way to try a
parameter or to reach rescue mode.

## The kernel and the initramfs

The kernel decompresses itself, initialises the CPUs, memory and devices, and reads its command
line, which you can see later in `/proc/cmdline`. On a typical server:

```bash
cat /proc/cmdline
```

```text
BOOT_IMAGE=/vmlinuz-6.1.0-26-amd64 root=UUID=1f0e7c55-2b8d-4c61-9d3e-7a4b2c9e8f10 ro quiet
```

`root=` names the root filesystem, `ro` mounts it read-only first so that it can be checked, and
`quiet` hides most messages. Other parameters you will use: `systemd.unit=rescue.target` (or
simply `rescue` or `1`) and `systemd.unit=emergency.target` (or `emergency`). Drivers that are
not built into the kernel are **modules**, loaded on demand; `lsmod` lists the loaded ones and
`sudo modprobe <name>` loads one with its dependencies. `dmesg` shows the kernel's own messages
from boot onwards, such as detected disks or hardware errors.

The kernel faces a puzzle: the root filesystem may be on an NVMe disk, inside LVM, on RAID or
encrypted, and the drivers for those live on the root filesystem. The **initramfs** (initial RAM
filesystem) solves it. It is a compressed archive loaded by the boot loader next to the kernel,
unpacked into memory, that contains just enough tools and modules to find the root device,
unlock or assemble it, check it, and mount it. It then switches to the real root and starts
`/sbin/init`, which is systemd. Distributions rebuild it automatically when a kernel is
installed; after changing storage drivers or encryption, rebuild it yourself with
`sudo update-initramfs -u` on Debian or `sudo dracut -f` on Red Hat. A machine that stops with a
prompt like `(initramfs)` or a dracut shell could not find its root filesystem: check `root=` and
the devices the initramfs can see.

## systemd, targets and shutting down

systemd, running as PID 1, mounts the filesystems from `/etc/fstab`, starts services in
parallel according to their dependencies, and works towards `default.target`, normally a link
to `multi-user.target` on servers or `graphical.target` on desktops. These **targets** replace
the old System V **runlevels**: runlevel 1 corresponds to `rescue.target`, 3 to
`multi-user.target`, 5 to `graphical.target`, and 0 and 6 to `poweroff.target` and
`reboot.target`. `systemctl get-default` and `set-default` read and change the default.

Shut down through systemd so that services stop in order and filesystems are unmounted cleanly:
`sudo systemctl poweroff`, `sudo systemctl reboot`, or the classic `shutdown`, which can warn the
logged-in users first. `sudo shutdown -r +10 "Kernel update, back in 5 minutes"` reboots in ten
minutes and broadcasts the message to every terminal, as `wall` does; `sudo shutdown -c` cancels
it. Cutting the power instead risks losing data still in memory.

## Reading a boot

The journal records each boot separately, which makes it easy to read the one that went wrong.
On a typical server:

```bash
journalctl --list-boots | tail -n 2
journalctl -b -1 -p err
systemd-analyze
systemd-analyze blame | head -n 3
```

```text
 -1 7c1f2e9a0d3b4c5e8f6a1b2c3d4e5f60 Tue 2026-10-13 06:02:11 UTC Wed 2026-10-14 03:58:40 UTC
  0 a9d8c7b6e5f4a3b2c1d0e9f8a7b6c5d4 Wed 2026-10-14 04:01:02 UTC Wed 2026-10-14 10:30:15 UTC
Oct 14 03:58:31 web01 kernel: EXT4-fs error (device dm-2): ext4_find_entry:1683: inode #131073: comm nginx: reading directory lblock 0
Startup finished in 2.301s (kernel) + 4.882s (initrd) + 11.416s (userspace) = 18.600s
multi-user.target reached after 11.390s in userspace
          6.012s systemd-networkd-wait-online.service
          2.144s apt-daily-upgrade.service
          1.203s postgresql@15-main.service
```

`-b -1` with `-p err` is the first thing to read after an unexpected reboot. `systemd-analyze`
shows how long each stage took, `blame` lists units by start-up time, and `critical-chain` shows
the chain of units that the boot actually waited for. A slow unit in `blame` matters only if it
is on that chain.

## When it does not boot

Two targets exist for repairs. **rescue.target** gives a root shell on the console with all
filesystems mounted and almost no services: use it to fix a bad configuration or reset a
password. **emergency.target** is more minimal still: the root filesystem is mounted (possibly
read-only) and nothing else. systemd drops into emergency mode on its own when a filesystem that
is required for boot cannot be mounted or checked, and the most common cause is a mistake in
`/etc/fstab`, such as a mistyped UUID or a missing disk without `nofail`.

The repair goes like this: read the messages (`journalctl -xb` shows what failed); make the root
filesystem writable with `mount -o remount,rw /`; correct or comment out the bad fstab line;
check it with `findmnt --verify`; then `systemctl daemon-reload` and `mount -a`, and reboot when
both are clean. Both modes ask for the **root password**. On systems where root has no password,
as is usual on Ubuntu, they refuse, and you boot from installation or live media instead, mount
the system's disk, and repair it from there (with `chroot` into it to run tools such as
`update-grub` or `update-initramfs`).

## Common mistakes

- Editing `grub.cfg` directly, so the change disappears with the next kernel update.
- Changing storage drivers or encryption without rebuilding the initramfs.
- Rebooting after an fstab change without testing it, and meeting emergency mode.
- Reading only the current boot's journal after an unexpected reboot; the cause is in `-b -1`.
- Powering off a server instead of using `systemctl poweroff` or `shutdown`.

## Practice

1. Put the stages in order: initramfs, firmware, systemd, kernel, boot loader.
2. How do you boot once into rescue mode on a machine with GRUB, without changing any file?
3. A server stops at boot with "You are in emergency mode" right after a new disk was added to `/etc/fstab`. What do you do?

### Answers

1. Firmware, boot loader, kernel, initramfs, systemd.
2. Press `e` at the GRUB menu, add `systemd.unit=rescue.target` to the end of the `linux` line,
   and press `Ctrl+X`. The change applies to that boot only.
3. Log in with the root password, run `journalctl -xb` to see which mount failed, remount `/`
   read-write, fix or comment out the new fstab line (or add `nofail`), check it with
   `findmnt --verify`, run `systemctl daemon-reload` and `mount -a`, then reboot.

## Key takeaways

- Firmware, boot loader, kernel, initramfs, systemd: each hands over to the next.
- Change GRUB in `/etc/default/grub` and regenerate; press `e` for one-off changes.
- The initramfs finds and mounts the real root filesystem; rebuild it after storage changes.
- `journalctl -b -1 -p err` and `systemd-analyze` explain a bad or slow boot.
- Rescue mode mounts everything, emergency mode almost nothing; an fstab error leads to emergency mode.

## Further reading

- [bootup(7) manual page](https://man7.org/linux/man-pages/man7/bootup.7.html)
- [systemd.special(7) manual page](https://man7.org/linux/man-pages/man7/systemd.special.7.html)
- [kernel-command-line(7) manual page](https://man7.org/linux/man-pages/man7/kernel-command-line.7.html)
- [systemd-analyze(1) manual page](https://man7.org/linux/man-pages/man1/systemd-analyze.1.html)
