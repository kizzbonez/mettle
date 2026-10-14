The tests make an office folder holding `backup.sh`, `salaries.csv` and `notice.txt`, give each
file its own starting permissions, go into the folder and run your script there:

```bash
bash solution.sh
```

The starting permissions differ from test to test. Some tasks set permissions **exactly**, and
others **change one thing** and leave the rest as they were, so choose between the octal and the
symbolic form of `chmod` with care.

1. Let the owner run `backup.sh`: add execute for the owner and change nothing else.
2. Make `salaries.csv` private: read and write for the owner, and nothing at all for the group or
   for others, exactly `rw-------`.
3. Stop the group and others from changing `notice.txt`: take away their write permission and
   change nothing else.
4. Create the folder `drafts` with an empty file `drafts/plan.txt` in it. The folder must be
   exactly `rwxr-x---` (750) and the file exactly `rw-r-----` (640). You may set the umask first,
   as in the lesson, or use `chmod` after creating them.

The script prints nothing. The sandbox runs as an ordinary user, so `chown` to another user is
refused, as the lesson shows; this lab only changes permissions.

In the visible test, all three files start as `rw-r--r--` (644), except `notice.txt`, which starts
as `rw-rw-rw-` (666). Afterwards, as `ls -l` would show them:

```text
-rwxr--r--  backup.sh
-rw-------  salaries.csv
-rw-r--r--  notice.txt
drwxr-x---  drafts
-rw-r-----  drafts/plan.txt
```

The hidden tests start from other permissions, such as a `backup.sh` that others may not read and
a `notice.txt` that others may write but not read. They also run `./backup.sh` to see that it
works.
