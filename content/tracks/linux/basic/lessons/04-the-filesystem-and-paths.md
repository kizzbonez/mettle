---
title: The Filesystem and Paths
summary: How Linux arranges every file in one tree, what the main directories are for, how absolute and relative paths work, and how to move around and list directories with pwd, cd and ls.
minutes: 30
objectives:
  - Name the purpose of the main directories of the Filesystem Hierarchy Standard, such as /etc, /home, /usr, /var and /tmp
  - Write an absolute and a relative path to the same file, using `~`, `.` and `..`
  - Move around the tree with `cd` and always know where you are with `pwd`
  - List directories with `ls` and its main options, including hidden files and the long format
---

## Outline

1. One tree, starting at `/`
2. The main directories
3. Where am I? `pwd`
4. Absolute and relative paths
5. Moving around: `cd`
6. Listing: `ls`
7. Reading the long format
8. Hidden files
9. File names

## One tree, starting at `/`

A **file** holds data: text, a picture, a program. A **directory** (a folder) holds files and
other directories. Linux puts every file of every disk into a single tree whose top is the
**root directory**, written `/`. There are no drive letters as on Windows: a second disk or a
USB stick appears as a directory somewhere inside the tree.

## The main directories

The layout is described by the **Filesystem Hierarchy Standard** (FHS), which distributions
follow closely. Here is the top of the tree on this course's machine (in a terminal, `ls` lays
names out in columns):

```bash
ls /
```

```text
bin   dev  home  lib64  mnt  proc  run   src  sys  usr  work
boot  etc  lib   media  opt  root  sbin  srv  tmp  var
```

Yours will be similar; `src` and `work` exist only on this machine. The ones to know:

| Directory | Holds |
| --- | --- |
| `/etc` | System-wide configuration files, as text |
| `/home` | Users' home directories, such as `/home/dana` |
| `/root` | The home directory of the administrator, `root` |
| `/usr` | Installed software: `/usr/bin` holds most commands, `/usr/share` shared data such as manuals |
| `/usr/local` | Software installed by the local administrator, outside the package manager |
| `/bin`, `/sbin`, `/lib` | Essential commands, administration commands and libraries; on many current systems these are links into `/usr` |
| `/var` | Data that changes as the system runs; `/var/log` holds log files |
| `/tmp` | Temporary files, which may be deleted at any time, often at boot |
| `/dev` | Files that represent devices, such as disks |
| `/proc`, `/sys` | Virtual files the kernel generates, describing processes and hardware |
| `/boot` | The kernel and the files needed to start the machine |
| `/media`, `/mnt` | Where removable media and temporary disks are attached |
| `/opt` | Add-on software packages that keep all their files together |

You do not need to memorise it now, but when a guide says "edit the configuration in `/etc`" or
"check the logs in `/var/log`", this is the map.

## Where am I? `pwd`

At every moment the shell has a **working directory**, the directory you are "in". Commands
look for files there unless told otherwise. `pwd` (print working directory) shows it. A new
shell starts in your **home directory**, the one place an ordinary user may create files freely:

```bash
pwd
ls
```

```text
/home/dana
Documents  notes.txt  projects
```

## Absolute and relative paths

A **path** names a file by the directories you pass through to reach it, separated by `/`.

- An **absolute path** starts with `/` and is followed from the root:
  `/home/dana/projects/website/index.html`. It means the same thing wherever you are.
- A **relative path** does not start with `/` and is followed from the working directory.
  From `/home/dana`, the same file is `projects/website/index.html`.

Three shorthands work in any path:

| Shorthand | Means |
| --- | --- |
| `.` | This directory |
| `..` | The parent directory, one level up |
| `~` | Your home directory (`~sam` is user sam's) |

So from `/home/dana/projects/website`, the path `../../notes.txt` climbs two levels to
`/home/dana` and names `notes.txt` there. Every directory contains the entries `.` and `..`,
which is why they work everywhere.

## Moving around: `cd`

`cd` (change directory) takes one path, absolute or relative:

```bash
cd /usr/share
pwd
cd ..
pwd
cd
pwd
cd -
```

```text
/usr/share
/usr
/home/dana
/usr
```

`cd ..` goes up one level. `cd` with no argument (or `cd ~`) goes home, whatever happened
before. `cd -` returns to the previous directory and prints its name. When a path is wrong, `cd`
says so and leaves you where you were:

```bash
cd /nowhere
cd /root
```

```text
bash: cd: /nowhere: No such file or directory
bash: cd: /root: Permission denied
```

The first does not exist. The second exists, but the administrator's home is closed to
ordinary users; lesson 9 explains permissions.

## Listing: `ls`

`ls` lists the working directory, or the files and directories you name. Its everyday options:

| Option | Effect |
| --- | --- |
| `-l` | Long format: one line per entry with details |
| `-a` | All entries, including hidden ones |
| `-A` | Almost all: hidden ones, but not `.` and `..` |
| `-h` | With `-l`, sizes such as `2.3M` instead of bytes |
| `-d` | List a directory itself, not its contents |
| `-F` | Mark directories with `/` and programs with `*` |
| `-R` | Recurse into every subdirectory |
| `-t`, `-S`, `-r` | Sort by time (newest first), by size, or reverse the order |

```bash
ls -F projects/website
ls -lh Documents
ls -ld projects
```

```text
images/  index.html
total 2.3M
-rw-r--r-- 1 dana dana 2.3M Oct 12 09:30 report.pdf
drwxr-xr-x 3 dana dana 4096 Oct 13 16:05 projects
```

Without `-d`, `ls -l projects` would list what is inside `projects`; with it you see the
directory's own line. Asking for something that is not there is an error, with exit status 2:

```bash
ls Notes.txt
```

```text
ls: cannot access 'Notes.txt': No such file or directory
```

The file is `notes.txt`; names are case-sensitive.

## Reading the long format

```text
-rw-r--r-- 1 dana dana   22 Oct 12 09:30 notes.txt
```

From left to right: the **type** (`-` a regular file, `d` a directory, `l` a symbolic link),
nine **permission** characters (lesson 9), the number of **links** (lesson 8), the **owner**,
the **group**, the **size** in bytes, the **modification time** (when the content last
changed) and the **name**. The line `total` above a listing is the disk space the files use,
in blocks, and can be ignored.

## Hidden files

A name that starts with a dot is **hidden**: `ls` skips it unless you add `-a` or `-A`. Programs
use hidden files for settings, so they do not clutter your listing.

```bash
ls -A
```

```text
.bash_logout  .bashrc  .profile  Documents  notes.txt  projects
```

There is nothing secret about them; it is only a convention of `ls` and of the shell.

## File names

Names are case-sensitive, so `Notes.txt` and `notes.txt` are two different files. Extensions
such as `.txt` are only part of the name; Linux does not need them to know what a file contains.
A name may contain spaces, but every space then needs special care at the command line (lesson
7), so prefer `-` or `_` in names you choose.

## Common mistakes

- **Adding a `/` to a relative path.** `cd /projects` looks for `projects` at the root, not in
  your home. Drop the leading slash, or write `~/projects`.
- **Forgetting where you are.** Run `pwd` before anything that changes files. The prompt shows
  it too.
- **Expecting `ls` to show dot files.** Use `ls -A`.
- **Reading `ls -l dir` as information about `dir`.** It lists the contents; add `-d`.
- **Writing files outside your home.** Paths such as `/etc` and `/usr` belong to the system;
  ordinary users cannot change them, and should not try.

## Practice

1. You are in `/home/dana/projects/website/images`. Write two paths to `/home/dana/notes.txt`:
   one absolute and one relative, without using `~`.
2. What do these commands print, in order?

```bash
cd /var/log
cd ../..
pwd
cd -
```

3. Which `ls` command lists everything in your home directory, hidden files included but not
   `.` and `..`, in long format with readable sizes?

### Answers

**1.** Absolute: `/home/dana/notes.txt`. Relative: `../../../notes.txt` (from `images` up to
`website`, `projects` and `dana`).

**2.** `pwd` prints `/`, because `/var/log` up two levels is the root. `cd -` then returns to
`/var/log` and prints `/var/log`.

**3.** `ls -lAh ~`, or `ls -lAh` when you are already at home.

## Key takeaways

- One tree from `/`: configuration in `/etc`, users in `/home`, software in `/usr`, logs in
  `/var/log`, scratch space in `/tmp`.
- Absolute paths start with `/`; relative paths start from the working directory.
- `.` is here, `..` is up, `~` is home; `cd` alone goes home and `cd -` goes back.
- `ls -l` shows type, permissions, links, owner, group, size, time and name; `-A` shows hidden
  files.

## Further reading

- [Filesystem Hierarchy Standard 3.0](https://refspecs.linuxfoundation.org/FHS_3.0/fhs/index.html)
- [hier(7): description of the filesystem hierarchy](https://man7.org/linux/man-pages/man7/hier.7.html)
- [ls(1)](https://man7.org/linux/man-pages/man1/ls.1.html)
- [LinuxCommand.org: Navigation](https://linuxcommand.org/lc3_lts0020.php)
