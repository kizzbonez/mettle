# A tree like the shared folder: months, a name with a space, files without a
# final newline, a directory whose name ends in .csv, and files to ignore.
mkdir -p tree/2026/09 tree/2026/10 tree/archive.csv
printf 'date,employee,project,hours\n2026-09-07,Ana Ruiz,apollo,3' > 'tree/2026/09/ana week 37.csv'
printf 'date,employee,project,hours\n2026-09-07,Ben Okafor,borealis,2.5' > tree/2026/09/ben.csv
printf '2026-10-01,Cleo Park,apollo,1\n' > tree/2026/10/cleo.csv
printf '2026-10-02,Dee Shah,cygnus,4\n' > tree/top.csv
printf '2026-10-03,Eli Novak,borealis,1\n' > tree/archive.csv/inner.csv
printf '2026-10-02,Dee Shah,cygnus,100\n' > tree/notes.txt
printf '2026-10-02,Dee Shah,cygnus,100\n' > tree/top.csv.bak
printf '2026-10-02,Dee Shah,cygnus,100\n' > tree/2026/OLD.CSV

expected='apollo 4.0
cygnus 4.0
borealis 3.5
total 11.5
rejected 0'

actual=$(bash solution.sh tree) || fail "solution.sh exited with a non-zero status"
assert_eq "$actual" "$expected" "every .csv file in the tree is read, and only those"

actual=$(bash solution.sh tree/) || fail "solution.sh exited with a non-zero status when the folder ends in /"
assert_eq "$actual" "$expected" "the folder given with a trailing slash"

mkdir -p 'shared folder'
cp -R tree 'shared folder/september export'
actual=$(bash solution.sh 'shared folder') || fail "solution.sh exited with a non-zero status for a folder with a space in its name"
assert_eq "$actual" "$expected" "a folder whose name contains spaces"
