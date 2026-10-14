---
title: SSH and File Transfer
summary: Log in with key pairs instead of passwords, organise connections in ~/.ssh/config, tunnel ports through SSH, copy files with scp and rsync, and harden the SSH server without locking yourself out.
minutes: 30
objectives:
  - Create a key pair with `ssh-keygen`, install the public key in `authorized_keys`, and fix the permissions SSH insists on
  - Explain host keys and `known_hosts`, and respond correctly to a changed host key warning
  - Write `~/.ssh/config` entries with a jump host, and forward a remote port to your machine
  - Copy and synchronise directories with `scp` and `rsync`, and harden `sshd_config` safely
---

## Outline

1. How SSH protects a session
2. Key pairs
3. The client configuration
4. Tunnels
5. Copying files: scp and rsync
6. Hardening the server

## How SSH protects a session

**SSH** (Secure Shell) gives you an encrypted, authenticated connection to another machine,
normally on TCP port 22. The client is `ssh`; the server is the daemon `sshd`, from OpenSSH.
Two questions are settled at the start of every connection.

**Is this really the server?** Each server has **host keys** (`/etc/ssh/ssh_host_*_key`). On
your first connection the client shows the key's fingerprint and asks whether to trust it; if
you say yes, it is stored in `~/.ssh/known_hosts`. On later connections the client compares.
If the key has changed, ssh prints a large warning ("REMOTE HOST IDENTIFICATION HAS CHANGED")
and refuses password login, because someone may be intercepting the connection. Find out *why*
it changed (a reinstalled server? a new machine on the same address?) before removing the old
entry with `ssh-keygen -R hostname`.

**Who are you?** The server accepts a password, or, much better, proof that you hold a
private key.

## Key pairs

**Public key authentication** uses two files. The **private key** stays on your machine and
never leaves it. The **public key** is copied to every server you want to reach. The server
sends a challenge that only the private key can answer, so no secret crosses the network and
there is nothing for an attacker to guess. These commands need the network and OpenSSH, which
the sandbox lacks, so the output is from a typical laptop:

```bash
ssh-keygen -t ed25519 -C "ana@laptop"
ssh-copy-id -i ~/.ssh/id_ed25519.pub ana@web01.example.com
ssh ana@web01.example.com
```

```text
Generating public/private ed25519 key pair.
Enter file in which to save the key (/home/ana/.ssh/id_ed25519):
Enter passphrase (empty for no passphrase):
Enter same passphrase again:
Your identification has been saved in /home/ana/.ssh/id_ed25519
Your public key has been saved in /home/ana/.ssh/id_ed25519.pub
The key fingerprint is:
SHA256:7p3dQx0mUoGJ1cVfPZr8Lw2kq9S5hYbTn4aE6uXcR0M ana@laptop
```

Ed25519 keys are short, fast and secure; recent OpenSSH versions create them by default, and
naming the type keeps older versions from making RSA keys. Protect the private key with a
**passphrase**, so a stolen laptop does not mean stolen servers, and load it once per session
into **ssh-agent** with `ssh-add`, so you type the passphrase once.

`ssh-copy-id` appends the public key, one line, to `~/.ssh/authorized_keys` on the server.
SSH is strict about permissions: if your home directory, `~/.ssh` or `authorized_keys` can be
written by other users, sshd ignores the keys and falls back to a password, with only a log line
on the server to explain why. The safe modes are:

```bash
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys ~/.ssh/id_ed25519
chmod 644 ~/.ssh/id_ed25519.pub
```

A line in `authorized_keys` can carry restrictions before the key, for example
`from="10.20.0.0/24",command="/usr/local/bin/backup-receive" ssh-ed25519 AAAA...` lets that key
connect only from one network and only run one command, which is right for automated backups.

## The client configuration

Typing `ssh -p 2222 -i ~/.ssh/id_work ana@10.20.0.12` every time invites mistakes.
`~/.ssh/config` names the connections once:

```text
Host bastion
    HostName bastion.example.com
    User ana
    IdentityFile ~/.ssh/id_ed25519

Host db02 web01
    HostName %h.corp.example.com
    User ana
    ProxyJump bastion

Host *
    ServerAliveInterval 30
```

Now `ssh db02` connects through the bastion (a **jump host**, the one machine exposed to the
internet) to `db02.corp.example.com`. `%h` stands for the name you typed. For every option,
the **first value found** is used, so put specific `Host` blocks first and `Host *` defaults
last. `scp`, `rsync` and `git` all read this file too. The file must not be writable by others,
or ssh refuses it.

## Tunnels

SSH can carry other TCP connections. **Local forwarding** opens a port on your machine and
forwards it through the server:

```bash
ssh -N -L 5433:localhost:5432 db02
psql -h localhost -p 5433 -U report salesdb
```

Connections to port 5433 on your laptop come out on `db02` as connections to its own
`localhost:5432`, so you reach a database that listens only on loopback, without opening it to
the network. `-N` runs no remote command. **Remote forwarding** (`-R 8080:localhost:3000`) is
the reverse: a port on the server leads back to your machine. `ssh -X` forwards graphical
programs (X11), and `-J bastion` is `ProxyJump` on the command line.

## Copying files: scp and rsync

`scp` copies over SSH with `cp`-like syntax: `scp report.pdf web01:/tmp/` or
`scp -r web01:/etc/nginx ./nginx-backup`. It copies everything every time.

`rsync` compares source and destination and sends only what changed, so the second run of a
large copy takes seconds. It uses SSH whenever a path contains `host:`:

```bash
rsync -av --dry-run ./site/ web01:/var/www/site/
rsync -av --delete ./site/ web01:/var/www/site/
```

```text
sending incremental file list
index.html
css/main.css

sent 2,418 bytes  received 61 bytes  4,958.00 bytes/sec
total size is 48,207  speedup is 19.45 (DRY RUN)
```

`-a` (archive) recurses and keeps permissions, times, symbolic links, owner and group; `-v` lists
the files; `-z` compresses on slow links; `-P` shows progress and lets an interrupted transfer
resume. The **trailing slash on the source** matters: `site/` copies the *contents* of `site`,
while `site` copies the directory itself, creating `/var/www/site/site`. `--delete` removes
destination files that are not in the source, which makes a true mirror and is also the fastest
way to destroy data when the paths are wrong. Always run it with `--dry-run` (`-n`) first.

## Hardening the server

The server reads `/etc/ssh/sshd_config`. Debian and Ubuntu start it with
`Include /etc/ssh/sshd_config.d/*.conf`, and since **the first value obtained for a keyword
wins**, a drop-in file there overrides a later line in the main file; that is the place for your
settings:

```text
# /etc/ssh/sshd_config.d/10-hardening.conf
PermitRootLogin no
PasswordAuthentication no
KbdInteractiveAuthentication no
PubkeyAuthentication yes
AllowGroups sshusers
MaxAuthTries 3
```

No root logins (people log in as themselves and use `sudo`); no passwords, so password-guessing
bots get nowhere; only members of `sshusers` may log in. Changing the port reduces log noise but
is not security by itself.

The risk is locking yourself out of a remote server. Do it in this order: confirm your key
login works; run `sudo sshd -t`, which checks the configuration and prints nothing if it is
valid (`sudo sshd -T` prints the effective settings); keep your current session open; run
`sudo systemctl reload ssh` (the unit is `sshd` on Red Hat systems); and test a *new* login from
a second terminal before you close the first. Existing sessions survive a reload.

## Common mistakes

- Accepting a changed host key without asking why it changed.
- Group- or world-writable `~/.ssh` or `authorized_keys`, so keys are silently ignored.
- A private key without a passphrase on a laptop, or copied to servers.
- `rsync --delete` without `--dry-run`, or a missing trailing slash that nests the directory.
- Turning off `PasswordAuthentication` before key login works, then closing the only session.
- Putting settings at the end of `sshd_config` when an earlier line or drop-in sets the same keyword.

## Practice

1. Write a `~/.ssh/config` entry so that `ssh backup` logs in as `svc-backup` on `nas01.example.com` port 2222 with the key `~/.ssh/id_backup`.
2. What is the difference between `rsync -a photos backup:/data/` and `rsync -a photos/ backup:/data/`?
3. `PasswordAuthentication no` is the last line of `sshd_config`, but passwords still work. Give two possible reasons.

### Answers

1. `Host backup`, then indented `HostName nas01.example.com`, `User svc-backup`, `Port 2222`
   and `IdentityFile ~/.ssh/id_backup`.
2. The first creates `/data/photos/` on the server; the second copies the contents of `photos`
   straight into `/data/`.
3. An earlier line, or a file included from `sshd_config.d` at the top, sets
   `PasswordAuthentication yes` first, and the first value wins; or sshd was never reloaded.
   `sudo sshd -T | grep -i passwordauthentication` shows the value in effect.

## Key takeaways

- Host keys prove the server's identity; investigate a changed key before removing it.
- Use Ed25519 keys with a passphrase and ssh-agent; keep `~/.ssh` at mode 700.
- `~/.ssh/config` names hosts, users, keys and jump hosts once; the first match wins.
- `rsync -av` with `--dry-run` first; mind the trailing slash and `--delete`.
- Harden sshd in a drop-in, test with `sshd -t`, reload, and keep a session open.

## Further reading

- [OpenSSH: ssh(1)](https://man.openbsd.org/ssh)
- [OpenSSH: ssh-keygen(1)](https://man.openbsd.org/ssh-keygen.1)
- [OpenSSH: sshd_config(5)](https://man.openbsd.org/sshd_config)
- [rsync(1) manual page](https://man7.org/linux/man-pages/man1/rsync.1.html)
