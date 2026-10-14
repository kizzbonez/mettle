# Windows line endings on most lines (the last one has none), titles in mixed case.
printf 'date,member,title\r\n' > windows-loans.csv
printf '2026-04-01,M1,Persuasion\r\n' >> windows-loans.csv
printf '2026-04-01,M2,PERSUASION\r\n' >> windows-loans.csv
printf '2026-04-02,M3,Ulysses\r\n' >> windows-loans.csv
printf '2026-04-02,M1,ulysses\r\n' >> windows-loans.csv
printf '2026-04-03,M4,Moby Dick\r\n' >> windows-loans.csv
printf '2026-04-03,M2,persuasion\n' >> windows-loans.csv

actual=$(bash solution.sh windows-loans.csv) || fail "solution.sh exited with a non-zero status"
assert_eq "$actual" '      3 persuasion
      2 ulysses
      1 moby dick' "a loans file with Windows line endings and titles in mixed case"
