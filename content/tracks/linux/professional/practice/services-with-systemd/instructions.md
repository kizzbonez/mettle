Complete `solution.sh`. It is run as `bash solution.sh UNIT_FILE` and reviews one service unit.

1. **Read the file as systemd does.** Ignore spaces and tabs at the start and end of each line.
   Skip empty lines and comments (lines starting with `#` or `;`). A line `[Name]` starts the
   section `Name`. A setting is `Key=Value`: the key is the text before the **first** `=`, the
   value everything after it, both with surrounding spaces removed. Keys are case-sensitive
   (`user=` is not `User=`), and a setting counts **only in its own section**: `ExecStart`, `User`
   and `Restart` in `[Service]`, `WantedBy` in `[Install]`.
2. **Repeated settings.** For `User` and `Restart` the **last** line wins, and an empty value
   (`Restart=`) resets the setting to its default: no user (the service runs as root) and
   `Restart=no`. Each `WantedBy` line adds to a list, and an empty `WantedBy=` empties it.
3. **Print the problems**, in this order:
   - for every `ExecStart` line with a non-empty value containing `|`, `>`, `<` or `&`, in file
     order: `shell syntax in ExecStart: VALUE`. Skip it when the command is run by a shell
     explicitly: its first word is `sh` or `bash` or ends in `/sh` or `/bash`, and its second
     word is `-c`;
   - `runs as root: no User=` when there is no user;
   - `not restarted after a crash: Restart=no` when `Restart` is `no`;
   - `cannot be enabled: no WantedBy= in [Install]` when the `WantedBy` list is empty.
4. If there is no problem, print `no problems found` and exit with status 0. Otherwise exit with
   status 1.

Example: `bash solution.sh data/reportd.service` prints the following and exits with status 1:

```text
shell syntax in ExecStart: /usr/local/bin/reportd --port 8080 > /var/log/reportd.log 2>&1
runs as root: no User=
```

**Tip:** one `awk` program does it all: keep the current section in a variable, split each
setting with `index(line, "=")` and `substr`, and print the problems in the `END` block.
