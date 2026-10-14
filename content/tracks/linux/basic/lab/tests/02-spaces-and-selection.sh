site="uploads/site B"
mkdir -p "$site/old"
printf 'time,flow_l\n06:00,12\n' > "$site/north field.csv"
printf 'time,flow_l\n06:00,9\n' > "$site/south field.csv"
printf 'time,flow_l\n06:00,3\n' > "$site/old/last week.csv"
printf 'time,flow_l\n' > "$site/.partial.csv"
printf '06:00 ERROR pump 2 stalled\n06:05 INFO pump 2 restarted\n06:30 ERROR pump 2 stalled\n' > "$site/pump log.log"
printf '07:00 ERROR old entry\n' > "$site/old/archive.log"
printf 'Site B, week 42.\n' > "$site/README.txt"
printf 'Check the pump.\n' > "$site/to do.txt"
before=$(ls -AR "$site")

release="out/week 42/release"
actual=$(bash solution.sh "$site" "$release") || fail "solution.sh exited with a non-zero status"

expected='readings: 2
logs: 1
notes: 2
errors: 2'
assert_eq "$actual" "$expected" "the summary for an upload whose folder and file names contain spaces"

assert_eq "$(ls -A "$release/readings")" "north field.csv
south field.csv" "the files copied into readings (top level only, no hidden files)"
assert_eq "$(ls -A "$release/logs")" "pump log.log" "the files copied into logs (top level only)"
assert_eq "$(ls -A "$release/notes")" "README.txt
to do.txt" "the files copied into notes"
assert_eq "$(cat "$release/SUMMARY.txt" 2> /dev/null)" "$expected" "SUMMARY.txt holds the same four lines as the output"
assert_eq "$(ls -AR "$site")" "$before" "the upload folder is left exactly as it was"
