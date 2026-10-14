---
title: Permissions and Ownership
summary: How Linux decides who may read, change and run each file, what r, w and x mean on files and on directories, and how to change permissions with chmod, ownership with chown and chgrp, and the defaults with umask.
minutes: 30
objectives:
  - Read the permission string in `ls -l` for owner, group and others, on files and on directories
  - Change permissions with `chmod` in symbolic form (`u+x`, `go-w`) and in octal form (`644`, `750`)
  - Explain who may change a file's owner and group, and use `chown` and `chgrp`
  - Predict the permissions of new files and directories from the `umask`
---

## Outline

1. Users and groups
2. Reading the permission string
3. What `r`, `w` and `x` mean on files
4. What `r`, `w` and `x` mean on directories
5. `chmod` in symbolic form
6. `chmod` in octal form
7. Owners and groups: `chown` and `chgrp`
8. Default permissions: `umask`
9. Special bits you will see

## Users and groups

Linux is a multi-user system, so every file belongs to someone. Each account has a **user name**
and a number, the **UID**. Users are collected into **groups**, which have a number too, the
**GID**, so that a team can share files. Every user has one primary group (on Debian and
Ubuntu, a group with the same name as the user) and may belong to more. `id` shows yours:

```bash
id
```

```text
uid=10002(dana) gid=10002(dana) groups=10002(dana),10004(design)
```

Accounts are listed in `/etc/passwd` and groups in `/etc/group`. One account is special:
**root**, UID 0, the administrator, for whom permission checks are skipped. That is exactly why
you should not work as root by habit.

## Reading the permission string

```bash
ls -l /etc/passwd /etc/shadow
cat /etc/shadow
```

```text
-rw-r--r-- 1 root root   966 Oct 14 11:15 /etc/passwd
-rw-r----- 1 root shadow 554 Oct 14 11:15 /etc/shadow
cat: /etc/shadow: Permission denied
```

After the type character come nine characters in three groups of three:

```text
-  rw-  r--  r--
   |    |    others: everyone else
   |    group: members of the file's group
   owner (the "user")
```

Each group reads `r` (read), `w` (write), `x` (execute), with `-` where that permission is
missing. Linux checks only **one** set: the owner's if you own the file, otherwise the group's
if you are in the file's group, otherwise the others'. `/etc/shadow`, which holds password
hashes, gives others nothing, so `dana` is refused.

## What `r`, `w` and `x` mean on files

- `r`: read the contents (`cat`, `cp`).
- `w`: change the contents.
- `x`: run the file as a program.

A new script is not executable until you say so. `./backup.sh` runs the file `backup.sh` in the
working directory (lesson 13 explains the `./`):

```bash
ls -l backup.sh
./backup.sh
chmod u+x backup.sh
./backup.sh
```

```text
-rw-r--r-- 1 dana dana 19 Oct 14 11:15 backup.sh
bash: ./backup.sh: Permission denied
Backup done
```

## What `r`, `w` and `x` mean on directories

A directory is a list of names, so the letters mean something different:

- `r`: **list** the names in it (`ls`).
- `w`: **change the list**: create, delete or rename entries. This needs `x` as well.
- `x`: **enter** it and **use** the entries: `cd` into it, open files inside it.

Two surprises follow. First, without `x` you can see the names but not use them:

```bash
chmod u-x box
ls box
cat box/a.txt
cd box
```

```text
a.txt
cat: box/a.txt: Permission denied
bash: cd: box: Permission denied
```

Second, **deleting a file is a change to its directory**, so it depends on the directory's `w`,
not on the file's own permissions. In a directory without `w`, `rm box/a.txt` fails with
`Permission denied` even though you own a writable file; in a writable directory you can delete
a read-only file (`rm` asks first, unless given `-f`).

## `chmod` in symbolic form

`chmod` (change mode) changes permissions. Only the file's owner (or root) may use it. The
symbolic form is **who**, **operator**, **what**:

| Part | Choices |
| --- | --- |
| who | `u` owner, `g` group, `o` others, `a` all three |
| operator | `+` add, `-` remove, `=` set exactly |
| what | `r`, `w`, `x` |

```bash
chmod go-r salaries.txt
ls -l salaries.txt
chmod u=rw,g=r,o= salaries.txt
ls -l salaries.txt
```

```text
-rw------- 1 dana dana 12 Oct 14 11:15 salaries.txt
-rw-r----- 1 dana dana 12 Oct 14 11:15 salaries.txt
```

Commas separate several changes, and `o=` with nothing after it removes all of the others'
permissions. Symbolic changes are relative: they leave the other bits alone. `chmod -R`
applies a change to a directory and everything below it.

## `chmod` in octal form

Each permission has a value, `r` = 4, `w` = 2, `x` = 1, and each group of three is written as
the sum, one digit per group: owner, group, others. So `7` is `rwx`, `6` is `rw-`, `5` is
`r-x`, `4` is `r--` and `0` is `---`. Four modes cover most needs:

| Mode | String | Typical use |
| --- | --- | --- |
| `755` | `rwxr-xr-x` | Programs and ordinary directories |
| `644` | `rw-r--r--` | Ordinary files |
| `700` | `rwx------` | A private directory |
| `600` | `rw-------` | A private file, such as a key |

```bash
chmod 640 salaries.txt
chmod 755 backup.sh
ls -l salaries.txt backup.sh
```

```text
-rwxr-xr-x 1 dana dana 19 Oct 14 11:15 backup.sh
-rw-r----- 1 dana dana 12 Oct 14 11:15 salaries.txt
```

(`ls` sorts the names it is given.)

Octal sets **all** nine bits at once, so it is the clearest way to say "exactly this".

## Owners and groups: `chown` and `chgrp`

`chown USER FILE` changes the owner, `chown USER:GROUP FILE` both, and `chown :GROUP FILE` or
`chgrp GROUP FILE` only the group. The rules are strict:

- only **root** may give a file to another user;
- the owner may change the group, but only to a group they belong to.

```bash
chgrp design salaries.txt
ls -l salaries.txt
chown sam salaries.txt
chgrp sam salaries.txt
```

```text
-rw-r----- 1 dana design 12 Oct 14 11:15 salaries.txt
chown: changing ownership of 'salaries.txt': Operation not permitted
chgrp: changing group of 'salaries.txt': Operation not permitted
```

`dana` is in `design`, so the first change works; she is not root and not in `sam`'s group, so
the others fail. An administrator would run `sudo chown sam salaries.txt`, where `sudo` runs one
command as root after checking that the user is allowed to.

## Default permissions: `umask`

New files and directories do not start with arbitrary permissions. Programs ask for `666`
(`rw-rw-rw-`) for files and `777` for directories, and the **umask** lists bits to take away.
The common umask `022` removes write for group and others:

```bash
umask
touch new.txt
mkdir newdir
ls -ld new.txt newdir
```

```text
0022
-rw-r--r-- 1 dana dana    0 Oct 14 11:15 new.txt
drwxr-xr-x 2 dana dana 4096 Oct 14 11:15 newdir
```

`umask 027` would give `640` files and `750` directories, keeping everything away from others.
The setting lasts until the shell exits; lesson 13 shows how to make it permanent. `umask -S`
prints it in symbolic form. Files never get `x` by default, which is why scripts need `chmod`.

## Special bits you will see

`ls -ld /tmp` shows `drwxrwxrwt`: everyone may create files there, and the **sticky bit** `t`
stops users from deleting each other's files. `/usr/bin/passwd` shows `-rwsr-xr-x`: the
**setuid** bit `s` makes the program run as its owner, root, so users can change their own
password entry. A later level covers these in depth.

## Common mistakes

- **Using `chmod 777` to "fix" an error.** It lets every user change or replace the file. Find
  which permission is missing and add only that.
- **Forgetting `x` on directories.** A directory needs `x` to be entered and used; `644` on a
  directory makes it unusable. Directories usually want `755` or `750`.
- **Making a file read-only to protect it from deletion.** Deletion is controlled by the
  directory's `w`.
- **Mixing up the digit order.** It is always owner, group, others.
- **Trying `chown` as an ordinary user.** It is refused; ask an administrator.

## Practice

1. Write `rwxr-x---` in octal, and `640` as a string.
2. A colleague in your group should be able to read `plan.txt` but not change it; everyone else
   should not see it. Give a symbolic and an octal command.
3. With umask `077`, what permissions do a new file and a new directory get?

### Answers

**1.** `rwx` = 7, `r-x` = 5, `---` = 0, so `750`. `640` is `rw-r-----`.

**2.** `chmod u=rw,g=r,o= plan.txt` or `chmod 640 plan.txt`.

**3.** Files `600` (`rw-------`), directories `700` (`rwx------`): the mask removes everything
for group and others.

## Key takeaways

- `ls -l` shows owner, group and others, each with `r`, `w` and `x`; only one set applies to you.
- On directories, `r` lists, `w` changes the list (including deletes), `x` enters and uses.
- `chmod` takes symbolic changes (`u+x`, `go-w`) or octal modes (`644`, `755`, `600`).
- Only root changes owners; `umask` decides the permissions of new files.

## Further reading

- [chmod(1)](https://man7.org/linux/man-pages/man1/chmod.1.html)
- [chown(1)](https://man7.org/linux/man-pages/man1/chown.1.html)
- [chown(2): who may change ownership](https://man7.org/linux/man-pages/man2/chown.2.html)
- [LinuxCommand.org: Permissions](https://linuxcommand.org/lc3_lts0090.php)
