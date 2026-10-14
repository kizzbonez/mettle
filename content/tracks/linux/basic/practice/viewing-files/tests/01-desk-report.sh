# This test copies the two files from data/ into the folder pool1, goes into
# it, runs your script there and shows you what it printed.
mkdir -p pool1
cp data/bookings.log data/poster.png pool1/
script="$PWD/solution.sh"
cd pool1 || fail "could not go into pool1"
actual=$(bash "$script")

echo "Your script printed:"
echo "$actual"
echo

expected='== header ==
time,lane,swimmer
== latest ==
08:00,3,Aisha
08:30,2,Lena
09:00,1,Kofi
== count ==
7 bookings.log
== poster ==
poster.png: ASCII text'
assert_eq "$actual" "$expected" "the report for the files in data/"
