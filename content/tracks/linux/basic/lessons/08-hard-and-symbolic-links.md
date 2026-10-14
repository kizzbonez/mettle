---
title: Hard and Symbolic Links
summary: How a file name points to an inode, how hard links give one file several names, how symbolic links point to a path, and what breaks when a target is moved or deleted.
minutes: 25
objectives:
  - Explain the difference between a file name and an inode, and read inode numbers and link counts with `ls -li`
  - Create hard links with `ln` and symbolic links with `ln -s`, and say which one survives deleting the original name
  - Predict whether a symbolic link with a relative target still works after the link or its target moves
  - Inspect a link's target with `readlink` and `readlink -f`
---

## Outline

1. Names and inodes
2. Hard links: `ln`
3. What deleting really does
4. Limits of hard links
5. Symbolic links: `ln -s`
6. Relative targets and broken links
7. Reading a link: `readlink`
8. Copy or link?

## Names and inodes

On a Linux filesystem, a file's data and its name are stored separately.

- The **inode** (index node) holds everything about the file except its name: its type, size,
  owner, permissions, timestamps, where its data lives on disk, and a **link count**. Every inode
  has a number, unique within its filesystem.
- A **directory** is a list of entries, each pairing a **name** with an inode number.

So a name is only a label that points to an inode. `ls -i` prints the inode number in front of
each name:

```bash
ls -li budget.txt
```

```text
523909 -rw-r--r-- 1 dana dana 17 Oct 14 11:13 budget.txt
```

The `1` after the permissions, which lesson 4 left unexplained, is the link count: one name
points to this inode.

## Hard links: `ln`

`ln TARGET NEWNAME` adds a second name for the same inode. That second name is a **hard link**.

```bash
ln budget.txt budget-hard.txt
ls -li budget*
```

```text
523909 -rw-r--r-- 2 dana dana 17 Oct 14 11:13 budget-hard.txt
523909 -rw-r--r-- 2 dana dana 17 Oct 14 11:13 budget.txt
```

Same inode number, link count 2. Neither name is the "original" or the "copy": they are two
equal names for one file. A change made through one name is visible through the other, because
there is only one set of data:

```bash
echo "v2 line added" >> budget-hard.txt
cat budget.txt
```

```text
v1 of the budget
v2 line added
```

(`>>` adds a line to the end of a file; lesson 10 covers it.)

## What deleting really does

`rm` does not erase data. It removes a **name** from a directory and lowers the inode's link
count. Only when the count reaches zero, and no program still has the file open, is the space
given back.

```bash
rm budget.txt
ls -li
cat budget-hard.txt
```

```text
total 4
523909 -rw-r--r-- 1 dana dana 31 Oct 14 11:13 budget-hard.txt
v1 of the budget
v2 line added
```

The data survived because one name still pointed to it.

## Limits of hard links

```bash
mkdir docs
ln docs docs-link
ln /etc/hostname myhost
```

```text
ln: docs: hard link not allowed for directory
ln: failed to create hard link 'myhost' => '/etc/hostname': Invalid cross-device link
```

- You cannot hard link a **directory**; that could create loops in the tree.
- A hard link cannot cross to **another filesystem** (another disk or partition, which the
  error calls a *device*), because inode numbers only mean something inside their own
  filesystem. On this machine `/etc` and `/home` are on different filesystems.

## Symbolic links: `ln -s`

A **symbolic link** (a *symlink* or *soft link*) is a small file of its own, with its own inode,
whose content is a **path** to something else. Opening the link opens whatever that path leads
to. It may point to a directory, and to another filesystem.

```bash
ln budget-hard.txt budget.txt
ln -s budget.txt latest.txt
ls -li
cat latest.txt
```

```text
total 12
523909 -rw-r--r-- 2 dana dana   31 Oct 14 11:13 budget-hard.txt
523909 -rw-r--r-- 2 dana dana   31 Oct 14 11:13 budget.txt
523910 drwxr-xr-x 2 dana dana 4096 Oct 14 11:13 docs
523915 lrwxrwxrwx 1 dana dana   10 Oct 14 11:13 latest.txt -> budget.txt
v1 of the budget
v2 line added
```

The first line gave `budget.txt` back as a second hard link, hence link count 2 again. Read
the symlink's line: type `l`, a new inode, size 10 (the length of the text `budget.txt`), and
`-> budget.txt` showing where it points. Its permissions always show `rwxrwxrwx`; on Linux they
are ignored, and the target's permissions apply. Note the argument order, the same as `cp`:
first what exists, then the new name.

## Relative targets and broken links

A symlink stores its target as text and resolves it later, **relative to the directory the link
is in**, not to where you were when you created it. Two consequences:

```bash
mkdir archive
ln -s budget.txt archive/wrong-link
cat archive/wrong-link
ln -s ../budget.txt archive/right-link
cat archive/right-link
```

```text
cat: archive/wrong-link: No such file or directory
v1 of the budget
v2 line added
```

`wrong-link` points to `archive/budget.txt`, which does not exist. A link whose target is
missing is called **broken** (or *dangling*); `ls` still lists it, but using it fails with "No
such file or directory". The target must be written from the link's point of view:
`../budget.txt`.

The same thing happens when the target moves or is renamed:

```bash
mv budget.txt budget-2026.txt
cat latest.txt
```

```text
cat: latest.txt: No such file or directory
```

A hard link would not have cared: it points to the inode, not the name. Move the file back and
the symlink works again. In short:

- a **relative** target keeps working if you move the link **and** its target together (a
  whole project folder, say), and breaks if only one of them moves;
- an **absolute** target, such as `/home/dana/links/docs`, keeps working wherever the link
  goes, and breaks if the target moves.

## Reading a link: `readlink`

`readlink LINK` prints the stored target text; `readlink -f LINK` follows every link and prints
the final absolute path. For a name that is not a symlink, plain `readlink` prints nothing and
exits with status 1.

```bash
readlink latest.txt
readlink -f latest.txt
ls -l /bin /lib
```

```text
budget.txt
/home/dana/links/budget.txt
lrwxrwxrwx 1 root root 7 Oct  5 00:00 /bin -> usr/bin
lrwxrwxrwx 1 root root 7 Oct  5 00:00 /lib -> usr/lib
```

The last command shows symlinks doing real work: on current Debian, Ubuntu and Fedora systems,
`/bin` and `/lib` are links into `/usr`, so old paths keep working. Removing a symlink with `rm`
removes only the link; the target is not touched.

## Copy or link?

| You want | Use |
| --- | --- |
| An independent duplicate you can change separately | `cp` |
| A second name for the same data, on the same filesystem | `ln` (hard link) |
| A shortcut to a file or directory, anywhere, visible as a link | `ln -s` |

Symlinks are the everyday choice, for example a `current` link pointing to the newest release
directory, switched to a new one with `ln -sfn NEW current` (`-f` replaces the existing link,
`-n` treats a link to a directory as a plain name).

## Common mistakes

- **Swapping the arguments.** `ln -s TARGET LINKNAME`: the thing that exists comes first.
- **Writing the target relative to where you stand.** It is resolved from the link's own
  directory.
- **Expecting a symlink to follow a renamed target.** It stores a path; rename the target and
  the link breaks.
- **Thinking `rm` on a hard link deletes the data.** The data lives until the last name goes.
- **Creating over an existing name.** `ln -s a b` fails with `File exists` when `b` exists. Use
  `-f` only if you mean to replace it.

## Practice

1. `report.txt` has link count 1. After `ln report.txt r2.txt` and `rm report.txt`, can you
   still read the text? Why?
2. In `/home/dana`, you run `ln -s notes.txt backup/notes-link`. Does it work? What should you
   have typed?
3. Which of these are possible: a hard link to a directory; a symlink to a directory; a
   symlink to a file on another disk?

### Answers

**1.** Yes, through `r2.txt`. Both names pointed to one inode; removing one name left the link
count at 1, so the data was kept.

**2.** No. The link lives in `backup/`, so `notes.txt` is looked for as `backup/notes.txt`. Type
`ln -s ../notes.txt backup/notes-link` (or use the absolute path `/home/dana/notes.txt`).

**3.** Only the last two. Hard links to directories are refused; symlinks may point to
directories and across filesystems.

## Key takeaways

- A name points to an inode; the inode holds the file's data location and details.
- A hard link is another name for the same inode; data lasts until the link count reaches zero.
- A symlink stores a path, resolved from the link's directory; it breaks if the target moves.
- `ls -li` shows inode numbers and link counts; `readlink` shows a symlink's target.

## Further reading

- [ln(1)](https://man7.org/linux/man-pages/man1/ln.1.html)
- [symlink(7): symbolic link handling](https://man7.org/linux/man-pages/man7/symlink.7.html)
- [inode(7): file inode information](https://man7.org/linux/man-pages/man7/inode.7.html)
- [readlink(1)](https://man7.org/linux/man-pages/man1/readlink.1.html)
