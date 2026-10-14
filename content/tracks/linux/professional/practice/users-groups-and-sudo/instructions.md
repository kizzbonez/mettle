Complete `solution.sh`. It is run as

```bash
bash solution.sh PASSWD GROUP USER
```

where `PASSWD` and `GROUP` are copies of `/etc/passwd` and `/etc/group`, and it prints what
`id USER` prints, using only those two files.

1. Find the line of `PASSWD` whose **first field is exactly** `USER`. If there is none, print
   `id: 'USER': no such user` on **standard error**, print nothing on standard output, and exit
   with status 1.
2. Otherwise print one line, `uid=UID(USER) gid=GID(NAME) groups=LIST`, and exit with status 0.
   `UID` and `GID` are the third and fourth fields of the user's line, and `NAME` is the name of
   the group in `GROUP` whose GID (third field) is `GID`: the **primary group**.
3. `LIST` is comma-separated entries `GID(NAME)`: first the primary group, then every group whose
   member list (the fourth field, comma-separated names) contains `USER` as a **whole name**, in
   the order of `GROUP`. A group that is already in the list is not repeated.

Example: `bash solution.sh data/passwd data/group ana` prints

```text
uid=1000(ana) gid=1000(ana) groups=1000(ana),100(users),996(docker),1010(plans)
```

`ana` is in the member lists of `users`, `docker` (`anabel,ana`) and `plans`; she is not in any
group whose list only contains `anabel`.

**Tip:** `awk -F:` splits the account files, and `split($4, members, ",")` turns a member list
into an array you can compare name by name.
