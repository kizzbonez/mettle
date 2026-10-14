---
title: Installing Software
summary: Understand packages, dependencies and repositories, then search, install, remove and list software with apt and dpkg on Debian and Ubuntu, and with dnf and rpm on Fedora and Red Hat.
minutes: 30
objectives:
  - Explain what a package, a dependency and a repository are, and why a package manager is safer than copying programs by hand
  - Refresh, search, install, upgrade and remove software with `apt`, and query installed packages with `dpkg`
  - Do the same jobs with `dnf` and `rpm` on Red Hat family systems
  - Find which package owns a file and which files a package installed
---

## Outline

1. Packages, dependencies and repositories
2. Two families, two levels of tools
3. Querying what is installed with `dpkg`
4. Installing and removing with `apt`
5. The Red Hat family: `dnf` and `rpm`
6. The same jobs side by side

## Packages, dependencies and repositories

A **package** is an archive holding a program's files together with **metadata**: its name,
version, description, and the other packages it needs. Those needs are its **dependencies**: a
program that reads compressed files might depend on a compression library, which might depend on
the C library. A **repository** is a server that publishes thousands of packages and an index of
them, signed by the distribution so that your system can check that nothing was tampered with.

A **package manager** ties these together. Asked for one program, it downloads it and every
dependency from the repositories, installs them in the right order, records every file it put on
disk, and can later upgrade or remove all of it cleanly. Installing through the package manager is
almost always better than downloading programs from websites: you get security updates through
the same channel, and nothing is left behind on removal.

Installing and removing software changes the whole system, so it needs the administrator account,
**root**. On most desktops and servers you run such a command with `sudo`, which runs one command
as root after asking for your password; the Professional level covers it. Querying needs no
special rights.

## Two families, two levels of tools

Most distributions belong to one of two families, and each family has two levels of tools:

| | Debian, Ubuntu, Mint | Fedora, RHEL, Rocky, AlmaLinux |
| --- | --- | --- |
| Package files | `.deb` | `.rpm` |
| Low level: one package file, no downloads | `dpkg` | `rpm` |
| High level: repositories and dependencies | `apt` (and `apt-get`, `apt-cache`) | `dnf` (formerly `yum`) |

The low-level tool installs a package file you already have and keeps the database of what is
installed, but it does not fetch missing dependencies. The high-level tool reads the repositories,
works out dependencies and calls the low-level tool to do the installing. openSUSE uses `rpm`
with its own high-level tool, `zypper`.

## Querying what is installed with `dpkg`

These commands only read the package database, so any user can run them. The output is from
Debian 12.

```bash
dpkg -l gawk
dpkg -L gawk | grep '^/usr/bin'
dpkg -S /usr/bin/gawk
dpkg-query -W gawk jq
```

```text
Desired=Unknown/Install/Remove/Purge/Hold
| Status=Not/Inst/Conf-files/Unpacked/halF-conf/Half-inst/trig-aWait/Trig-pend
|/ Err?=(none)/Reinst-required (Status,Err: uppercase=bad)
||/ Name           Version      Architecture Description
+++-==============-============-============-===================================================
ii  gawk           1:5.2.1-2    amd64        GNU awk, a pattern scanning and processing language
/usr/bin
/usr/bin/gawk
/usr/bin/gawkbug
gawk: /usr/bin/gawk
gawk	1:5.2.1-2
jq	1.6-2.1+deb12u2
```

- `dpkg -l pattern` lists packages with their state. The first two letters are the desired action
  and the actual status: `ii` means "should be installed, and is"; `rc` means "removed, but its
  configuration files remain".
- `dpkg -L package` lists the files a package installed.
- `dpkg -S path` finds the package that owns a file. On Debian 12 some files are recorded under
  `/bin` even though they live in `/usr/bin` (`/bin` is a link to it), so if `dpkg -S /usr/bin/sed`
  finds nothing, try `dpkg -S bin/sed`.
- `dpkg -s package` shows the full status and metadata, and `dpkg-query -W` prints name and
  version, tab-separated, which suits scripts.
- `dpkg -i file.deb` installs a package file, but stops if dependencies are missing.

## Installing and removing with `apt`

`apt` is the friendly front end for everyday use:

| Command | Does |
| --- | --- |
| `apt update` | download fresh package indexes from every repository |
| `apt upgrade` | upgrade installed packages, never removing any |
| `apt full-upgrade` | upgrade, removing packages if the upgrade requires it |
| `apt search word` | search the available packages for a word or regex |
| `apt show package` | show version, size, dependencies and description |
| `apt install package` | install a package and its dependencies |
| `apt remove package` | remove a package but keep its configuration files |
| `apt purge package` | remove a package and its configuration files |
| `apt autoremove` | remove dependencies nothing needs any more |
| `apt list --installed` | list installed packages |

Run `apt update` before installing or upgrading: `apt` only knows the versions listed in the
indexes it last downloaded. The repositories themselves are configured in
`/etc/apt/sources.list` and in files under `/etc/apt/sources.list.d/`. Without root, `apt`
refuses to change anything:

```bash
apt list --installed gawk 2>/dev/null
apt install cowsay
```

```text
Listing...
gawk/now 1:5.2.1-2 amd64 [installed,local]

WARNING: apt does not have a stable CLI interface. Use with caution in scripts.

E: Could not open lock file /var/lib/dpkg/lock-frontend - open (13: Permission denied)
E: Unable to acquire the dpkg frontend lock (/var/lib/dpkg/lock-frontend), are you root?
```

The warning is meant seriously: `apt`'s output may change between versions. In scripts, use the
older `apt-get` (`apt-get update`, `apt-get install -y package`) and `apt-cache` (`apt-cache
search`, `apt-cache policy`), whose behaviour is kept stable. `-y` answers "yes" to the
confirmation question so the script does not stop to wait for one.

```bash
apt-cache policy gawk | head -3
```

```text
gawk:
  Installed: 1:5.2.1-2
  Candidate: 1:5.2.1-2
```

`Installed` is the version you have and `Candidate` the version `apt` would install now.

## The Red Hat family: `dnf` and `rpm`

Fedora and Red Hat Enterprise Linux use `.rpm` packages, the low-level `rpm` tool and the
high-level `dnf`. `dnf` succeeded the older `yum` and largely keeps its commands; since Fedora 41
the `dnf` command is DNF 5. Unlike `apt`, `dnf` checks whether its copy of the repository data
has expired and downloads fresh data by itself, so there is normally no separate update step
(`--refresh` forces one). Repositories are defined in files under `/etc/yum.repos.d/`.

| Job | `dnf` | `rpm` |
| --- | --- | --- |
| Search | `dnf search word` | |
| Show details | `dnf info package` | `rpm -qi package` |
| Install | `dnf install package` | `rpm -ivh file.rpm` |
| Upgrade everything | `dnf upgrade` | |
| Remove | `dnf remove package` | `rpm -e package` |
| List installed | `dnf list --installed` | `rpm -qa` |
| Files of a package | | `rpm -ql package` |
| Owner of a file | `dnf provides /usr/bin/tito` | `rpm -qf /usr/bin/tito` |
| Check installed files | | `rpm -V package` |

`rpm` options start with an operation: `-q` queries, `-i` installs, `-U` upgrades and `-e`
erases. `-v` and `-h` add progress output. `dnf remove` also removes dependencies that nothing
else needs, and `dnf provides` searches the repositories, so it also finds packages you have not
installed yet.

## The same jobs side by side

| Job | Debian family | Red Hat family |
| --- | --- | --- |
| Refresh indexes | `apt update` | automatic |
| Install | `apt install pkg` | `dnf install pkg` |
| Remove | `apt remove pkg` | `dnf remove pkg` |
| What is installed? | `dpkg -l`, `apt list --installed` | `rpm -qa`, `dnf list --installed` |
| Which package owns this file? | `dpkg -S path` | `rpm -qf path` |
| Which files did it install? | `dpkg -L pkg` | `rpm -ql pkg` |

## Common mistakes

- **Installing without `apt update`.** `apt` works from the index it last downloaded, so it
  offers old versions and may try to fetch files the mirror no longer has.
- **`dpkg -i` or `rpm -i` for files with dependencies.** They stop with dependency errors;
  install through `apt` or `dnf`, which fetch what is missing.
- **Using `apt` in scripts.** Its output may change; use `apt-get` and `apt-cache`.
- **Expecting `remove` to delete configuration.** On Debian use `purge`.
- **Mixing families.** A `.rpm` does not belong on Debian, nor a `.deb` on Fedora.

## Practice

1. On Debian, find which package installed `/usr/bin/jq`, then list the files it installed.
2. Install the package `tree` on Fedora, then on Debian.
3. Print only the names of all installed Debian packages, one per line.

### Answers

1. `dpkg -S /usr/bin/jq` prints `jq: /usr/bin/jq`; then `dpkg -L jq`.
2. Fedora: `sudo dnf install tree`. Debian: `sudo apt update` and then `sudo apt install tree`.
3. `dpkg-query -W | cut -f1`, since `-W` separates name and version with a tab. In a script this
   is better than parsing `apt list`.

## Key takeaways

- Packages carry files and metadata; repositories publish them; the package manager resolves
  dependencies.
- `dpkg` and `rpm` handle single package files and the database; `apt` and `dnf` handle
  repositories and dependencies.
- Query freely; install, upgrade and remove as root.
- `dpkg -S` and `rpm -qf` find a file's package; `dpkg -L` and `rpm -ql` list a package's files.

## Further reading

- [Debian Reference: Debian package management](https://www.debian.org/doc/manuals/debian-reference/ch02.en.html)
- [apt(8) manual page (Debian 12)](https://manpages.debian.org/bookworm/apt/apt.8.en.html)
- [DNF5 command reference](https://dnf5.readthedocs.io/en/latest/commands/index.html)
- [rpm(8) manual page](https://rpm-software-management.github.io/rpm/man/rpm.8)
