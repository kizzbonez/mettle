#!/usr/bin/env bash
# Hotel Maintenance Morning: pull the day's facts out of the tickets and logs.

echo "== leaks =="
# -i ignores case, -w wants the whole word, -c counts the matching lines.
grep -icw leak tickets.txt

echo "== open =="
# -v keeps the lines that do not match, -n numbers them.
grep -vn done tickets.txt

echo "== logs =="
# The pattern is quoted so that find, not the shell, expands it.
find floors -type f -name '*.log' | sort

echo "== urgent =="
# -r searches every file under floors, -l prints only the file names.
grep -rl URGENT floors | sort
