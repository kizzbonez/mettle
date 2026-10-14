---
title: Archives and Compression
summary: Bundle files with tar, shrink them with gzip and xz, exchange them as zip files, check that an archive arrived intact, and pick the right format for the job.
minutes: 25
objectives:
  - Explain the difference between archiving and compressing
  - Create, list and extract tar archives, compressed or not, including into another directory and one member at a time
  - Compress and decompress single files with `gzip` and `xz`, and read them without decompressing to disk
  - Choose between `.tar.gz`, `.tar.xz` and `.zip`, and verify a file with `sha256sum`
---

## Outline

1. Archiving and compressing are different jobs
2. Creating and listing a tar archive
3. Compressing the archive
4. Extracting
5. `gzip` and `xz` on their own
6. `zip` and `unzip`
7. Checking a file arrived intact
8. Choosing a format

## Archiving and compressing are different jobs

An **archive** is one file that holds many files and directories, together with their names,
permissions, owners and dates. **Compression** makes data smaller by encoding repeated patterns
more briefly. Unix keeps the two jobs in separate tools: `tar` (short for "tape archive") bundles
files, and `gzip`, `bzip2` or `xz` compress one stream of bytes. A file named `backup.tar.gz` is a
tar archive that was then compressed with gzip; together the two are often called a **tarball**.
Windows tools combine both jobs in the `.zip` format, which Linux handles with `zip` and `unzip`.

## Creating and listing a tar archive

Every `tar` command needs exactly one **operation**: `-c` creates, `-t` lists and `-x` extracts.
`-f name` gives the archive's file name and should always be present; `-v` (verbose) prints each
file as it is processed. Directories are archived with everything inside them. The first four
lines below create a small project for the examples.

```bash
mkdir -p project/src project/docs
seq 1 2000 | sed 's/$/ a line of very repetitive log text/' > project/docs/history.log
printf 'fn main() {}\n' > project/src/main.rs
printf '# Project\n' > project/README.md
tar -cf project.tar project
tar -tf project.tar
```

```text
project/
project/src/
project/src/main.rs
project/README.md
project/docs/
project/docs/history.log
```

The names inside are **relative paths**, exactly as you wrote them. If you archive an absolute
path such as `/home/ada/project`, GNU tar removes the leading `/` and says so (`Removing leading
'/' from member names`), so that extracting later recreates the files under the current directory
instead of overwriting the originals. You may meet the old style without a dash, `tar cvf`; it
means the same.

## Compressing the archive

Add `-z` to filter the archive through gzip, `-J` for xz or `-j` for bzip2. `-a` chooses by the
archive's suffix instead. The `file` command identifies a file by its content, whatever its name.

```bash
tar -czf project.tar.gz project
tar -cJf project.tar.xz project
ls -l project.tar project.tar.gz project.tar.xz | awk '{ print $5, $NF }'
file project.tar.gz
```

```text
92160 project.tar
5346 project.tar.gz
1356 project.tar.xz
project.tar.gz: gzip compressed data, from Unix, original size modulo 2^32 92160
```

Your sizes may differ by a few bytes, because the archive records dates. This log is unusually
repetitive, so it shrinks enormously; ordinary files shrink less, and
photos or videos that are already compressed hardly shrink at all. `-tv` lists an archive in
detail, like `ls -l`:

```bash
tar -tvzf project.tar.gz | head -3
```

```text
drwxr-xr-x sandbox/sandbox   0 2026-10-14 11:06 project/
drwxr-xr-x sandbox/sandbox   0 2026-10-14 11:06 project/src/
-rw-r--r-- sandbox/sandbox  13 2026-10-14 11:06 project/src/main.rs
```

## Extracting

`-x` extracts into the current directory. `-C dir` changes into `dir` first, and naming members
after the archive extracts only those. GNU tar recognises the compression by itself when it reads
an archive, so `tar -xf` works on all three files above.

```bash
mkdir restore one
tar -xf project.tar.gz -C restore
tar -xzf project.tar.gz -C one project/README.md
find restore one -type f | sort
```

```text
one/project/README.md
restore/project/README.md
restore/project/docs/history.log
restore/project/src/main.rs
```

Extracting overwrites files of the same name without asking. Before extracting an archive from
someone else, list it with `-t`: an archive whose members have no common top directory scatters
files all over the current directory.

## `gzip` and `xz` on their own

`gzip file` compresses a single file and **replaces** it with `file.gz`; `gunzip` (or `gzip -d`)
reverses it. `-k` keeps the original and `-c` writes to standard output. `zcat` prints a
compressed file without touching it, which is how you read old rotated logs. `xz`, `unxz` and
`xzcat` work the same way and compress harder but more slowly; `bzip2`, `bunzip2` and `bzcat` do
too. None of them accept a directory: that is what `tar` is for.

```bash
cp project/docs/history.log h.log
gzip h.log
ls h.log*
zcat h.log.gz | head -2
gzip project
```

```text
h.log.gz
1 a line of very repetitive log text
2 a line of very repetitive log text
gzip: project is a directory -- ignored
```

## `zip` and `unzip`

`zip -r archive.zip dir` archives and compresses in one step. `unzip -l` lists, and `unzip -d dir`
extracts into a directory. Zip compresses every file separately, which lets you extract one file
quickly, while a `.tar.gz` compresses everything as one stream and usually ends up smaller.

```bash
zip -qr project.zip project
unzip -l project.zip | tail -3
```

```text
    78893  2026-10-14 11:06   project/docs/history.log
---------                     -------
    78916                     6 files
```

`-q` (quiet) stops `zip` from printing a line per file.

## Checking a file arrived intact

A **checksum** is a short fingerprint computed from a file's bytes; changing a single byte changes
it completely. Download sites publish one next to each archive. `sha256sum file` prints the
fingerprint, and `sha256sum -c` checks files against a saved list.

```bash
sha256sum project.tar.gz > project.tar.gz.sha256
sha256sum -c project.tar.gz.sha256
echo tamper >> project.tar.gz
sha256sum -c project.tar.gz.sha256
```

```text
project.tar.gz: OK
project.tar.gz: FAILED
sha256sum: WARNING: 1 computed checksum did NOT match
```

## Choosing a format

| Situation | Format |
| --- | --- |
| Backups and transfers between Linux systems | `.tar.gz`: fast and available everywhere |
| Smallest download, time to spare | `.tar.xz`: slower, often much smaller |
| Sharing with Windows or macOS users | `.zip`: opens without extra software |
| One large file, such as a log | `gzip` or `xz` on its own |

## Common mistakes

- **Leaving out `-f`.** GNU tar then writes the archive to standard output; in a terminal it
  stops with `Refusing to write archive contents to terminal (missing -f option?)`.
- **Reversing the names.** The archive name comes straight after `-f`. `tar -czf notes.txt
  backup.tar.gz` treats `notes.txt` as the archive to create and **overwrites** it, then
  complains that `backup.tar.gz` does not exist.
- **Expecting `gzip` to keep the original.** It replaces it unless you add `-k`.
- **Extracting blind.** List with `-t` first.

## Practice

1. Create `docs.tar.gz` containing only the `docs` directory, stored as `docs/...` rather than
   `project/docs/...`.
2. Show the last line of `history.log` from `project.tar.xz` without extracting anything to disk.
3. You received `data.tar.gz` and `data.tar.gz.sha256`. How do you check it before extracting?

### Answers

1. `tar -czf docs.tar.gz -C project docs`. `-C project` changes into `project` before archiving,
   so the members are `docs/` and `docs/history.log`.
2. `tar -xJOf project.tar.xz project/docs/history.log | tail -1`. `-O` sends extracted files to
   standard output.
3. `sha256sum -c data.tar.gz.sha256` must print `data.tar.gz: OK`. Then `tar -tzf data.tar.gz`
   to see what is inside, and only then extract.

## Key takeaways

- `tar` archives, `gzip` and `xz` compress; `.tar.gz` is both, `.zip` is both in one tool.
- `tar -c`, `-t` and `-x` create, list and extract; `-f` names the archive, `-C` the directory.
- `gzip` and `xz` replace the file unless told otherwise; `zcat` and `xzcat` read without
  extracting.
- `sha256sum -c` proves a file is unchanged before you trust it.

## Further reading

- [tar(1) manual page](https://man7.org/linux/man-pages/man1/tar.1.html)
- [gzip(1) manual page (Debian)](https://manpages.debian.org/bookworm/gzip/gzip.1.en.html)
- [xz(1) manual page (Debian)](https://manpages.debian.org/bookworm/xz-utils/xz.1.en.html)
- [zip(1) manual page (Debian)](https://manpages.debian.org/bookworm/zip/zip.1.en.html)
