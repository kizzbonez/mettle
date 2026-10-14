---
title: What Linux and the Shell Are
summary: What an operating system, the Linux kernel and a distribution are, where Linux runs, how the terminal and the shell fit together, and how this course works.
minutes: 15
objectives:
  - Explain the difference between the Linux kernel, the GNU tools and a distribution
  - Name four kinds of computer that commonly run Linux
  - Distinguish the terminal, the shell and a command
  - Describe how the lessons, the mock exam and the lab fit together
---

## Outline

1. Operating systems and kernels
2. Linux and GNU
3. Distributions
4. Where Linux runs
5. The terminal and the shell
6. Why learn the command line
7. How this course works

## Operating systems and kernels

An **operating system** is the software that sits between the programs you use and the
hardware they run on. Its core is the **kernel**, the first program to start when the machine
boots and the only one allowed to touch the hardware directly. It shares the processor between
running programs, gives each program its own memory, talks to disks and network cards through
pieces of code called *drivers*, and keeps track of files, users and who may do what. An
ordinary program never reads a disk itself: it asks the kernel, through a request called a
*system call*.

## Linux and GNU

Strictly speaking, **Linux is a kernel**. Linus Torvalds announced it as a hobby project on
25 August 1991 and released version 0.01 that September. Since 1992 it has been published
under the GNU General Public License, which lets anyone read, change and share the source code,
provided they pass the same freedoms on. Thousands of developers and companies work on it
today.

Linux is *Unix-like*: it follows the design and conventions of Unix, an operating system from
the 1970s, so the commands in this course look much the same on any Unix-like system.

A kernel alone is not something a person can use. You also need a program that reads your
commands, and programs that list, copy and search files. On most Linux systems many of these
come from the **GNU project**: the Bash shell, the core utilities (`ls`, `cp`, `mkdir` and about
a hundred more), `grep` and `find`. That is why you will see the whole system called
**GNU/Linux**. The `uname` command, which prints facts about the system, shows both names.
(You are not expected to understand every command in this lesson; each is taught later.)

```bash
uname -s
uname -o
```

```text
Linux
GNU/Linux
```

`-s` asks for the kernel's name, and `-o` for the name of the operating system as a whole.

## Distributions

Nobody installs a bare kernel. A **distribution** (a *distro*) bundles the kernel, the GNU
tools, thousands of other programs, an installer and a **package manager**, the tool that
installs and updates software. Well known distributions include:

| Distribution | Notes |
| --- | --- |
| Debian | Community project, very stable; the base of many others |
| Ubuntu | Based on Debian; common on desktops and cloud servers |
| Fedora | Fast moving; the testing ground for Red Hat's products |
| Red Hat Enterprise Linux | Commercial, with long support; Rocky Linux and AlmaLinux rebuild it |
| Alpine | Tiny; popular inside containers |

Distributions differ in their package manager, their release cycle and their default settings.
The command line skills in this course work on all of them. Every Linux system describes itself
in the file `/etc/os-release`; here are its first two lines on the machine used for this
course's examples:

```bash
head -n 2 /etc/os-release
```

```text
PRETTY_NAME="Debian GNU/Linux 12 (bookworm)"
NAME="Debian GNU/Linux"
```

## Where Linux runs

- **Servers and the cloud.** Linux is the usual system for web servers, databases and rented
  cloud machines. Most have no screen: people reach them over the network and work entirely at
  the command line.
- **Containers.** A container packages a program with the files it needs and runs it on the
  host's Linux kernel. The labs in this course run in one.
- **Phones and devices.** Android is built on the Linux kernel, and so are many routers and
  televisions.
- **Desktops.** Linux runs as a desktop system, and Windows can run a real Linux system through
  WSL (the Windows Subsystem for Linux).

## The terminal and the shell

Two programs work together when you type commands, and it pays to keep them apart.

- The **terminal** (strictly, a *terminal emulator*) is the window. It draws text, takes your
  keystrokes and decides the font and colors. GNOME Terminal, Konsole, Windows Terminal and
  macOS Terminal are terminal emulators. The name comes from the keyboard and screen units
  that were once wired to large shared computers.
- The **shell** is the program running inside that window. It prints a *prompt*, reads the
  line you type, works out what you meant, asks the kernel to run the right program and shows
  you its output. A *console* is the same idea without a desktop: the text screen of the
  machine itself.

The standard shell on most Linux distributions is **Bash**, the GNU "Bourne Again SHell", a
successor to the original Unix shell `sh`. Others exist, such as zsh, fish and dash. This
course teaches Bash. Your login shell is recorded in a variable called `SHELL`, which `echo`
can print (variables are taught in the last lesson):

```bash
echo $SHELL
bash --version
```

```text
/bin/bash
GNU bash, version 5.2.15(1)-release (x86_64-pc-linux-gnu)
Copyright (C) 2022 Free Software Foundation, Inc.
License GPLv3+: GNU GPL version 3 or later <http://gnu.org/licenses/gpl.html>

This is free software; you are free to change and redistribute it.
There is NO WARRANTY, to the extent permitted by law.
```

The chain is always the same: your keystrokes go to the terminal, the terminal passes them to
the shell, the shell asks the kernel to run a program, and the program's output travels back
to the terminal window.

## Why learn the command line

A graphical file manager is fine for moving one photo. The command line wins when the job is
large (renaming five hundred files takes one line), when there is no desktop (servers and
containers usually have only a shell), and when the work must be repeatable: a command can be
written down, reviewed, shared and saved in a script. Small tools can also be combined, as
lesson 10 shows.

The price is that the shell trusts you. There is no recycle bin and no "are you sure?" unless
you ask for one, so this course teaches the safe habits alongside the commands.

## How this course works

This level has thirteen lessons that build in order: first commands and help, files, paths and
links, permissions, redirection, searching, editing, and your shell's own settings. Each has
examples with their real output, common mistakes, three exercises with worked answers, and
links to the manuals it rests on. It follows the beginner topics of the LPIC-1 certification
(topics 103 and 104); later levels add text processing, scripts, processes and administration.

The examples were run on Debian 12 with Bash 5.2, as an ordinary user called `dana` on a machine
called `pc1`. Dates and version numbers on your machine will differ. Follow along in a terminal
on any Linux system or in WSL on Windows, type the examples instead of pasting them, and read
every message the shell prints.

The level ends with a mock exam (ten questions in twenty minutes, 70% to pass) and a lab in
which you write a short Bash script that is tested in a sandbox.

## Common mistakes

- **Treating "the terminal" and "the shell" as one thing.** Font and colors belong to the
  terminal; prompts, aliases and command history belong to the shell. Knowing which program
  owns a setting tells you where to change it.
- **Expecting each distribution to need a different course.** The kernel, Bash and the GNU tools
  are the same everywhere. Package managers and some configuration files differ.
- **Practising as the administrator.** The administrator account, `root`, may delete anything.
  Learn as an ordinary user, where mistakes stay small.
- **Assuming macOS behaves identically.** macOS is Unix-like but ships BSD versions of many
  tools, whose options are not always the same as the GNU ones taught here.

## Practice

1. A server is described as "Ubuntu 24.04 with Linux 6.8, logged in with Bash". Which part is
   the distribution, which is the kernel and which is the shell?
2. Why does `uname -o` print `GNU/Linux` rather than just `Linux`?
3. You make the text in your terminal window larger, and later you create a shortcut command
   with `alias`. Which program keeps each of these settings?

### Answers

**1.** Ubuntu 24.04 is the distribution, Linux 6.8 is the kernel version and Bash is the shell.
The distribution chose to ship that kernel and that shell.

**2.** Because the operating system you use is more than the kernel. The shell and the basic
commands come from the GNU project, and the Linux kernel runs underneath them.

**3.** The text size belongs to the terminal emulator. The alias belongs to the shell, which is
where commands are read and interpreted.

## Key takeaways

- Linux is a kernel; a distribution adds the GNU tools, other software and a package manager.
- Linux runs servers, containers, phones, appliances and desktops.
- The terminal is the window; the shell is the program inside it that runs your commands.
- Bash is the standard shell on Linux and the one this course teaches.

## Further reading

- [The Linux Kernel Archives: What is Linux?](https://www.kernel.org/linux.html)
- [Bash manual page (man7.org)](https://man7.org/linux/man-pages/man1/bash.1.html)
- [LinuxCommand.org: What is "the shell"?](https://linuxcommand.org/lc3_lts0010.php)
- [LPI: Exam 101 objectives](https://www.lpi.org/our-certifications/exam-101-objectives/)
