---
title: Users, Groups and sudo
summary: Read the account databases, create, change and remove users and groups safely, set password ageing, and grant administrator rights through sudo without handing out the root password.
minutes: 30
objectives:
  - Read every field of a line in `/etc/passwd`, `/etc/shadow` and `/etc/group` and say which tool changes it
  - Create, modify, lock and remove accounts with `useradd`, `usermod`, `passwd`, `chage` and `userdel`
  - Add a user to a supplementary group without removing the groups they already have
  - Write a `sudoers` rule with `visudo` that grants exactly the commands a person needs
---

## Outline

1. Accounts are numbers
2. The three account files
3. Creating and changing accounts
4. Password ageing and locking
5. sudo and the sudoers file

## Accounts are numbers

Every process and every file on Linux belongs to a **user ID (UID)** and a **group ID (GID)**.
The kernel only ever compares these numbers; names are a convenience that the system looks up
in a database. UID 0 is **root**, the superuser, which the kernel lets past almost every
permission check. Distributions reserve low UIDs (usually 1 to 999) for **system accounts**
that run services such as `www-data` or `postgres`, and start people at 1000. Both limits come
from `UID_MIN` and `SYS_UID_MAX` in `/etc/login.defs`.

A user has one **primary group**, which new files are given, and any number of
**supplementary groups**, which grant extra access. A process gets its list of groups when the
user logs in, so after you add someone to a group they must log out and in again before it
takes effect.

## The three account files

`/etc/passwd` has seven colon-separated fields: name, password placeholder, UID, GID, comment
(called GECOS), home directory and login shell. It must be readable by everyone, because every
program that prints a file owner needs it. The `x` in the second field means "the real password
hash is in `/etc/shadow`", a file only root and the `shadow` group can read:

```bash
ls -l /etc/passwd /etc/shadow /etc/group
```

```text
-rw-r--r-- 1 root root   451 Oct 14 10:48 /etc/group
-rw-r--r-- 1 root root   886 Oct 14 10:48 /etc/passwd
-rw-r----- 1 root shadow 503 Oct 14 10:48 /etc/shadow
```

`/etc/shadow` has nine fields: name, password hash, the day of the last change, minimum age,
maximum age, warning period, inactivity period, account expiry date and a reserved field. Dates
are counted in **days since 1 January 1970**. A hash that starts with `!` is locked; a `*` or
`!` alone means no password can ever match; an **empty** field means no password is needed at
all, which is a serious hole. `/etc/group` has four fields: name, password, GID, and a
comma-separated member list of the users who have it as a supplementary group.

Because these are plain text files, the auditing skills you already have work on them. Run
here on `passwd.sample`, a saved copy of a server's file, the first command finds every account
with UID 0, which should only ever be `root`:

```bash
awk -F: '$3 == 0 { print $1 }' passwd.sample
awk -F: '$3 >= 1000 { printf "%-8s uid=%-5s shell=%s\n", $1, $3, $7 }' passwd.sample
```

```text
root
backup2
ana      uid=1000  shell=/bin/bash
deploy   uid=1001  shell=/bin/bash
```

`backup2` is a second root account, a classic sign of an intruder. On a real system prefer
`getent passwd ana` to reading the file: `getent` asks the **Name Service Switch**, so it also
finds accounts that come from a directory service such as LDAP.

## Creating and changing accounts

Never edit these files by hand on a live system; the tools lock the files, keep the four of
them consistent and make backups (`/etc/passwd-`). On Debian, `adduser` is a friendly
interactive wrapper; `useradd` is the portable tool that LPIC and scripts use. These commands
need root, so they cannot run in this course's sandbox; the output is from a typical system:

```bash
sudo useradd -m -s /bin/bash -c "Ana Reyes" -G developers ana   # -m: create /home/ana from /etc/skel
sudo passwd ana                                                 # set the first password
sudo useradd -r -s /usr/sbin/nologin -M reportd                 # a system account for a service
sudo usermod -aG docker ana                                     # ADD a supplementary group
id ana
```

```text
uid=1000(ana) gid=1000(ana) groups=1000(ana),1001(developers),998(docker)
```

`useradd` without `-m` creates no home directory on many systems, and without a password the
account stays locked. `-m` copies the files in `/etc/skel` (a default `.bashrc` and so on) into
the new home. A service account gets `-r` for a system UID and the shell `/usr/sbin/nologin`,
so nobody can log in as it.

The most damaging mistake in this lesson is `usermod -G docker ana` without `-a`. `-G` sets the
complete list of supplementary groups, so Ana silently leaves `developers` and every other
group she had. On a server where `sudo` rights come from a group, that one command can remove
the last administrator. Other useful changes: `usermod -s` changes the shell, `usermod -l` renames
the login (but not the home directory), and `usermod -e 2026-12-31` sets an expiry date for a
contractor. `groupadd`, `groupmod` and `groupdel` manage groups; `gpasswd -d ana docker` removes one
member from one group.

`userdel ana` removes the account but leaves the files; `userdel -r ana` also deletes the home
directory and mail spool. Files the user owned elsewhere keep the old UID, and the next account
created may reuse it and inherit them. Find them first with `find / -xdev -uid 1000`.

## Password ageing and locking

`chage` edits the ageing fields of `/etc/shadow`. `chage -l` shows them:

```bash
chage -l sandbox
```

```text
Last password change					: Oct 14, 2026
Password expires					: never
Password inactive					: never
Account expires						: never
Minimum number of days between password change		: 0
Maximum number of days between password change		: 99999
Number of days of warning before password expires	: 7
```

`chage -M 90 -W 14 ana` requires a new password every 90 days with two weeks of warning, and
`chage -d 0 ana` forces a change at the next login, which is the right way to hand over a
temporary password. `chage -E 2026-12-31 ana` expires the whole account.

To stop someone logging in, `passwd -l` or `usermod -L` puts `!` in front of the hash. That
blocks **password** logins only: an SSH key in `~/.ssh/authorized_keys` still works. To disable an
account completely, also expire it (`usermod -e 1`) or set its shell to `nologin`.

## sudo and the sudoers file

Sharing the root password means nobody knows who did what, and changing it locks everyone out.
**sudo** runs one command as another user (root by default) after asking for *your own*
password, and logs who ran what. Its policy is `/etc/sudoers`, plus files in `/etc/sudoers.d/`
that it includes. A rule reads *who where = (as whom) what*:

```text
# /etc/sudoers.d/web-team   (edit with: sudo visudo -f /etc/sudoers.d/web-team)
%sudo      ALL=(ALL:ALL) ALL
%webops    ALL=(root) /usr/bin/systemctl restart nginx, /usr/bin/systemctl reload nginx
deploy     ALL=(www-data) NOPASSWD: /usr/local/bin/deploy-site
```

The first line lets members of the group `sudo` (`%` means group) run anything as anyone. The
second lets `webops` members restart or reload nginx as root and nothing else. The third lets
the `deploy` account run one script as `www-data` without a password, which suits automation.
Use full paths, because sudo matches the path.

Always edit with **visudo**. It locks the file, checks the syntax before saving and refuses to
install a broken file. A syntax error in sudoers makes sudo refuse to run at all, and on a
server without a root password that means nobody can fix it without a rescue boot. Two more rules
from the manual: when several rules match, the **last** one wins, so put exceptions after
general rules; and files in `sudoers.d` whose names contain a dot or end in `~` are skipped, so
`web-team.conf` is silently ignored. Check what you are allowed with `sudo -l`. Be careful what you
grant: an editor, a pager or `find` can start a shell, so "`sudo vim` only" is root for anyone
who knows `:!bash`. Use `sudoedit` to let someone edit one file as root safely.

## Common mistakes

- `usermod -G group user` without `-a`, which removes every other supplementary group.
- Expecting a new group to apply to a shell that was opened before it was added.
- Editing `/etc/sudoers` with a normal editor and saving a syntax error.
- Naming a sudoers drop-in `admins.conf`, which sudo never reads.
- Believing `passwd -l` blocks SSH key logins.
- `userdel` without checking for files the old UID still owns.

## Practice

1. Write the command that adds the existing user `lee` to the `adm` group, keeping his other groups.
2. A line in `/etc/shadow` reads `guest::20740:0:99999:7:::`. What is wrong, and how do you fix it?
3. Write a sudoers rule that lets members of `dbadmins` run `/usr/bin/systemctl restart postgresql` as root, and nothing else.

### Answers

1. `sudo usermod -aG adm lee`. `-a` appends; `lee` must log in again to get the group.
2. The password field is empty, so `guest` can log in with no password. Lock it with
   `sudo passwd -l guest` (or set a password), and remove the account if nobody needs it.
3. `%dbadmins ALL=(root) /usr/bin/systemctl restart postgresql`, in a file such as
   `/etc/sudoers.d/dbadmins` (no dot in the name), edited with `sudo visudo -f`.

## Key takeaways

- The kernel sees UIDs and GIDs; `/etc/passwd`, `/etc/shadow` and `/etc/group` map names to them.
- Use `useradd`, `usermod`, `userdel`, `chage` and `passwd`, never a text editor, on account files.
- `usermod -aG` adds a group; `-G` alone replaces the list.
- Locking a password does not lock SSH keys; expire the account to disable it.
- Grant root through narrow `sudoers` rules edited with `visudo`, not by sharing the root password.

## Further reading

- [useradd(8) manual page](https://man7.org/linux/man-pages/man8/useradd.8.html)
- [usermod(8) manual page](https://man7.org/linux/man-pages/man8/usermod.8.html)
- [shadow(5) manual page](https://man7.org/linux/man-pages/man5/shadow.5.html)
- [sudoers(5) manual page](https://man7.org/linux/man-pages/man5/sudoers.5.html)
