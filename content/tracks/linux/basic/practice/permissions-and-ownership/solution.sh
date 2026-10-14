#!/usr/bin/env bash
# Food Bank Permissions: fix three files and create a private drafts folder.

# Symbolic changes are relative: u+x adds one bit and leaves the rest alone.
chmod u+x backup.sh

# Octal sets all nine bits at once: rw- for the owner, --- and --- after it.
chmod 600 salaries.csv

# Remove w for group and others, whatever else they have.
chmod go-w notice.txt

# With umask 027, new folders get 750 and new files 640.
umask 027
mkdir drafts
touch drafts/plan.txt
