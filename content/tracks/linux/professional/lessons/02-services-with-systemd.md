---
title: Services with systemd
summary: Control services with systemctl, read their status, write a service unit for your own program, override a packaged unit safely, and switch between targets.
minutes: 30
objectives:
  - Start, stop, restart, reload, enable and disable a service, and explain the difference between starting and enabling
  - Read `systemctl status` output and find failed units
  - Write a service unit with an `[Install]` section and load it with `daemon-reload`
  - Change a packaged unit with a drop-in override instead of editing the vendor file
---

## Outline

1. What systemd is
2. Controlling a service
3. Reading the status
4. Writing a service unit
5. Overriding a packaged unit
6. Targets

## What systemd is

**systemd** is the **init system** of almost every current distribution: the first process the
kernel starts (PID 1), which then starts and supervises everything else. It manages **units**,
each described by a small text file. The unit type is its suffix: `.service` for a program,
`.socket` for a listening socket that starts a service on demand, `.timer` for a schedule,
`.mount` for a mount point, and `.target` for a named group of units, much like the old runlevels.

Unit files live in three places, and the first one wins: `/etc/systemd/system/` (yours, the
administrator's), `/run/systemd/system/` (generated at run time) and `/usr/lib/systemd/system/`
(installed by packages). Never edit the files under `/usr/lib`; the next package upgrade
replaces them.

## Controlling a service

`systemctl` is the command for everything. Changing state needs root; reading it does not. The
course sandbox has no systemd, so the output in this lesson is from a typical server.

```bash
sudo systemctl start nginx       # run it now
sudo systemctl stop nginx        # stop it now
sudo systemctl restart nginx     # stop, then start (drops connections)
sudo systemctl reload nginx      # ask it to re-read its configuration, if it supports that
sudo systemctl enable nginx      # start it at every boot (does not start it now)
sudo systemctl enable --now nginx  # both at once
sudo systemctl disable nginx     # no longer at boot (does not stop it now)
systemctl is-active nginx; systemctl is-enabled nginx
```

```text
active
enabled
```

The key distinction is **now** versus **at boot**. `start` and `stop` act on the running system.
`enable` and `disable` only change what happens at the next boot, by creating or removing
symbolic links. A service that was started but not enabled vanishes after a reboot; one that
was enabled but not started is not running until then. Prefer `reload` to `restart` when the
service supports it, because a reload keeps existing connections.

`mask` is the strongest "off": it links the unit to `/dev/null`, so nothing can start it, not
even another unit that depends on it. Use it to make sure a service you have replaced stays
dead, and `unmask` to undo it. `is-active` and `is-enabled` exit with status 0 for yes, so
scripts can test them directly.

## Reading the status

`systemctl status` shows the state, the main process, its control group (every process the
service started) and the last ten lines of its log. On a typical server:

```bash
systemctl status backup-db.service
```

```text
× backup-db.service - Nightly database dump
     Loaded: loaded (/etc/systemd/system/backup-db.service; static)
     Active: failed (Result: exit-code) since Wed 2026-10-14 02:00:07 UTC; 7h ago
    Process: 4120 ExecStart=/usr/local/bin/backup-db (code=exited, status=1/FAILURE)
   Main PID: 4120 (code=exited, status=1/FAILURE)
        CPU: 211ms

Oct 14 02:00:05 db02 backup-db[4120]: pg_dump: error: connection to server failed
Oct 14 02:00:07 db02 systemd[1]: backup-db.service: Failed with result 'exit-code'.
```

Read it top to bottom. **Loaded** says which file defines the unit and whether it is enabled
(`static` means it has no `[Install]` section and is started by something else, here a timer).
**Active** gives the state: `active (running)`, `inactive (dead)`, or `failed`, with the reason.
The symbol in front is a green dot for active, a white circle for inactive and a red cross for
failed. To list everything that has failed, run `systemctl --failed`; this is the first command
to type on a server that "is acting strange".

## Writing a service unit

To run your own program as a service, write a unit file in `/etc/systemd/system/`:

```ini
# /etc/systemd/system/reportd.service
[Unit]
Description=Report generator API
Documentation=https://wiki.example.internal/reportd
Wants=network-online.target
After=network-online.target

[Service]
Type=simple
User=reportd
Group=reportd
WorkingDirectory=/srv/reportd
EnvironmentFile=-/etc/default/reportd
ExecStart=/usr/local/bin/reportd --port 8080
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

- `[Unit]` describes the unit and its relations. `Wants=` pulls another unit in; `After=` only
  orders the start. The two are independent, which is why they usually appear together.
- `[Service]` says how to run it. `Type=simple` (the default) means the program stays in the
  foreground; do not let it fork into the background. `ExecStart=` is not run by a shell, so
  pipes and redirections do not work; output goes to the journal automatically.
  `User=` runs it without root, and `Restart=on-failure` restarts it if it crashes (the default is
  `no`). The `-` before the environment file means "ignore it if it is missing".
- `[Install]` is read only by `enable`: `WantedBy=multi-user.target` makes `enable` create a link
  in `multi-user.target.wants/`, so the normal boot starts the service.

systemd caches unit files, so after creating or changing one you must run
`sudo systemctl daemon-reload` before starting it. Then `sudo systemctl enable --now reportd`.

## Overriding a packaged unit

To change one setting of a unit that a package installed, do not copy or edit it. Run
`sudo systemctl edit nginx`, which opens an empty **drop-in** file,
`/etc/systemd/system/nginx.service.d/override.conf`, and reloads systemd when you save:

```ini
[Service]
Restart=always
LimitNOFILE=65536
```

Only the lines you write change; package upgrades still update the rest. A setting that can
appear several times, such as `ExecStart=`, adds to the list in a drop-in, so to replace it
first clear it with an empty `ExecStart=` line and then give the new one. `systemctl cat nginx`
prints the unit file and every drop-in, which is how you find out why a unit behaves
differently from its file.

## Targets

A **target** groups units into a system state. `multi-user.target` is a normal server with
networking and no graphics; `graphical.target` adds a display manager; `rescue.target` is a
single-user shell with filesystems mounted; `emergency.target` is a shell with almost nothing.
`systemctl get-default` shows the target the system boots into, and `sudo systemctl set-default
multi-user.target` changes it. `sudo systemctl isolate rescue.target` switches now and stops
everything the target does not need, including your SSH session, so only do that at a console.

## Common mistakes

- Enabling a service and assuming it is running, or starting it and assuming it survives a reboot.
- Editing a unit and forgetting `daemon-reload`, then wondering why nothing changed.
- Editing files in `/usr/lib/systemd/system/`, which the next upgrade overwrites.
- Shell syntax (`|`, `>`, `&&`) in `ExecStart=`. Call a script, or `sh -c '...'` explicitly.
- A program that forks into the background under `Type=simple`: systemd thinks it exited.
- `isolate` over SSH.

## Practice

1. A service works after `systemctl start` but is gone after every reboot. What is missing?
2. You edited `/etc/systemd/system/reportd.service` and restarted it, but the old `ExecStart` still runs. Why?
3. Make the packaged `nginx.service` restart five seconds after a crash without touching its file.

### Answers

1. It was never enabled. `sudo systemctl enable reportd` creates the link from its `WantedBy=`
   target; `enable --now` would have done both. The unit needs an `[Install]` section for this.
2. systemd still uses the cached copy. Run `sudo systemctl daemon-reload`, then restart.
   `systemctl status` warns about this with "changed on disk".
3. `sudo systemctl edit nginx` and write `[Service]`, `Restart=on-failure`, `RestartSec=5`. The
   drop-in is saved under `/etc/systemd/system/nginx.service.d/` and systemd reloads itself.

## Key takeaways

- `start`/`stop` act now; `enable`/`disable` act at boot; `--now` does both.
- `systemctl status` and `systemctl --failed` are the first things to read on a sick server.
- Your units go in `/etc/systemd/system/`; run `daemon-reload` after every change.
- Change packaged units with drop-ins from `systemctl edit`, never in `/usr/lib`.
- Targets are system states; `multi-user.target` is the normal server state.

## Further reading

- [systemctl(1) manual page](https://man7.org/linux/man-pages/man1/systemctl.1.html)
- [systemd.service(5) manual page](https://man7.org/linux/man-pages/man5/systemd.service.5.html)
- [systemd.unit(5) manual page](https://man7.org/linux/man-pages/man5/systemd.unit.5.html)
- [systemd.special(7) manual page](https://man7.org/linux/man-pages/man7/systemd.special.7.html)
