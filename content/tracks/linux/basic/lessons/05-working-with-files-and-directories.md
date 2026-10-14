---
title: Working with Files and Directories
summary: Create, copy, move, rename and delete files and directories with mkdir, touch, cp, mv, rm and rmdir, and use the interactive and verbose options to do it safely.
minutes: 30
objectives:
  - Create nested directories in one step with `mkdir -p` and empty files with `touch`
  - Copy files and whole directory trees with `cp` and `cp -r`, and predict where a copy lands
  - Move and rename with `mv`, knowing that it replaces an existing file without asking
  - Delete safely with `rm`, `rmdir`, `-i` and `-v`, and explain why `rm -rf` is dangerous
---

## Outline

1. Creating directories: `mkdir`
2. Creating empty files: `touch`
3. Copying: `cp`
4. Copying directories: `cp -r`
5. Moving and renaming: `mv`
6. Asking first and showing what happened: `-i` and `-v`
7. Removing files: `rm`
8. Removing directories: `rmdir` and `rm -r`
9. Why `rm -rf` is dangerous

## Creating directories: `mkdir`

`mkdir` (make directory) creates the directories you name. By default the parent must already
exist; `-p` (parents) creates every missing level and does not complain if the directory is
already there. Adding `-v` (verbose) makes it report each one it creates.

```bash
mkdir garden
mkdir garden/plans/2026
mkdir -p garden/plans/2026
mkdir -pv trips/2026/lisbon
```

```text
mkdir: cannot create directory ‘garden/plans/2026’: No such file or directory
mkdir: created directory 'trips'
mkdir: created directory 'trips/2026'
mkdir: created directory 'trips/2026/lisbon'
```

Read the first error carefully: "No such file or directory" refers to the missing *parent*,
`garden/plans`, not to `2026`. Without `-p`, `mkdir garden` a second time would fail with
`File exists`.

## Creating empty files: `touch`

`touch` sets a file's modification time to now. If the file does not exist, it creates it,
empty, which is the everyday use:

```bash
touch garden/plans/2026/seeds.txt
ls -l garden/plans/2026
```

```text
total 0
-rw-r--r-- 1 dana dana 0 Oct 14 11:10 seeds.txt
```

The size is `0`. Run `touch` on an existing file and its contents stay untouched; only the time
changes.

## Copying: `cp`

`cp SOURCE DEST` copies a file. Two forms are worth separating:

- `cp a.txt b.txt` makes a copy called `b.txt`. If `b.txt` exists, it is **overwritten**.
- `cp a.txt b.txt photos/` copies several files **into** a directory, which must exist and must
  be the last argument. The copies keep their names.

```bash
cd garden
mkdir photos
cp plans/2026/seeds.txt seeds-backup.txt
cp plans/2026/seeds.txt seeds-backup.txt photos/
ls photos
```

```text
seeds-backup.txt  seeds.txt
```

## Copying directories: `cp -r`

By default `cp` refuses to copy a directory, and says why:

```bash
cp plans photos
cp -r plans plans-copy
cp -rv plans plans-copy
```

```text
cp: -r not specified; omitting directory 'plans'
'plans' -> 'plans-copy/plans'
'plans/2026' -> 'plans-copy/plans/2026'
'plans/2026/seeds.txt' -> 'plans-copy/plans/2026/seeds.txt'
```

`-r` (recursive) copies the directory and everything inside it. The second and third commands
differ only in `-v`, which prints each copy, yet they did different things:

- the first time, `plans-copy` did not exist, so `cp -r` **created** it as the copy;
- the second time, `plans-copy` existed, so `cp -r` put a copy **inside** it, as
  `plans-copy/plans`, which `-v` reveals.

That rule, "if the destination is an existing directory, the source goes inside it", applies to
`cp` and `mv` alike. When in doubt, add `-v` and look.

## Moving and renaming: `mv`

`mv` moves a file or directory to another place, or renames it, which is the same operation:
the content does not move, only the name changes. Unlike `cp`, it needs no `-r` for directories.

```bash
mv seeds-backup.txt seeds-old.txt
mv seeds-old.txt plans/
mv -v plans/seeds-old.txt .
```

```text
renamed 'plans/seeds-old.txt' -> './seeds-old.txt'
```

The first line renames, the second moves into `plans`, the third moves back into the working
directory (`.`). The danger: if the destination is an existing **file**, `mv` replaces it
without a word.

```bash
echo "new" > a.txt
echo "old" > b.txt
mv a.txt b.txt
cat b.txt
```

```text
new
```

(`echo ... > file` writes a line into a file, and `cat` prints a file; both are taught properly
in lessons 6 and 10.) The old `b.txt` is gone for good.

## Asking first and showing what happened: `-i` and `-v`

`cp`, `mv` and `rm` all accept:

- `-i` (interactive): ask before overwriting or deleting. Answer `y` to go ahead; anything else
  skips that file.
- `-v` (verbose): print each action, as above.

```bash
cp -i seeds-old.txt photos/seeds.txt
```

```text
cp: overwrite 'photos/seeds.txt'?
```

`mv -n` (no clobber) is the quiet alternative: it never overwrites an existing file.

## Removing files: `rm`

`rm` removes files. There is no recycle bin: the name is deleted at once.

```bash
rm nothing.txt
rm photos
```

```text
rm: cannot remove 'nothing.txt': No such file or directory
rm: cannot remove 'photos': Is a directory
```

`rm -f` (force) never asks and stays silent about missing files, which is convenient in scripts
and dangerous by hand.

## Removing directories: `rmdir` and `rm -r`

`rmdir` removes a directory only if it is **empty**, which makes it a safe tool:

```bash
rmdir photos
```

```text
rmdir: failed to remove 'photos': Directory not empty
```

`rm -r` removes a directory and everything inside it, at any depth. `rm -ri` asks about every
file and directory, and `rm -I` asks once before removing more than three files or recursing,
a good compromise.

## Why `rm -rf` is dangerous

`rm -rf DIR` combines "everything below" with "never ask". It is the right tool for a build
directory you are sure about, and a disaster with one wrong character. `rm -rf ~ /tmp/junk`
(an accidental space) removes your whole home directory before it reaches `/tmp/junk`. GNU `rm`
refuses to work on `/` itself unless given `--no-preserve-root`, but nothing protects your own
files. Habits that prevent it: run `ls` on the same path first, prefer `rm -rI`, and never
type `rm -rf` with a path you have not just checked.

## Common mistakes

- **Forgetting that the destination may exist.** `cp -r src dest` and `mv src dest` put `src`
  *inside* `dest` when `dest` is an existing directory.
- **Overwriting with `mv` or `cp`.** Both replace an existing file silently. Use `-i` or `-n`.
- **Expecting `rm` to be undoable.** Recovery is unreliable at best. Back up first.
- **Removing a file whose name starts with a dash.** `rm -n` is read as an option. Write
  `rm ./-n` or `rm -- -n`; `--` means "no more options follow".
- **Using `rm -r` where `rmdir` would do.** If a directory should be empty, `rmdir` proves it.

## Practice

1. Create the directories `music/rock/2025` and `music/jazz` from your home directory, with as
   few commands as possible, and an empty file `music/jazz/list.txt`.
2. `backup` is an existing directory. Where does `cp -r music backup` put the copy of
   `music/jazz/list.txt`? And if `backup` did not exist?
3. Remove the whole `music` tree, asking only once before anything is deleted.

### Answers

**1.**

```bash
mkdir -p music/rock/2025 music/jazz
touch music/jazz/list.txt
```

`-p` creates `music` and `music/rock` along the way. `mkdir` accepts several directories at
once.

**2.** With `backup` existing: `backup/music/jazz/list.txt`, because the copy goes inside it.
Without it: `backup/jazz/list.txt`, because `backup` becomes the copy of `music`.

**3.** `rm -rI music` asks one question (`rm: remove 1 argument recursively?`) and then removes
everything on `y`.

## Key takeaways

- `mkdir -p` makes whole paths; `touch` makes empty files.
- `cp` needs `-r` for directories; `mv` does not.
- An existing directory as destination receives the source *inside* it.
- `cp`, `mv` and `rm` act without asking and there is no undo; use `-i`, `-I` and `-v`, and check
  paths with `ls` before `rm -rf`.

## Further reading

- [cp(1)](https://man7.org/linux/man-pages/man1/cp.1.html)
- [mv(1)](https://man7.org/linux/man-pages/man1/mv.1.html)
- [rm(1)](https://man7.org/linux/man-pages/man1/rm.1.html)
- [LinuxCommand.org: Manipulating Files](https://linuxcommand.org/lc3_lts0050.php)
