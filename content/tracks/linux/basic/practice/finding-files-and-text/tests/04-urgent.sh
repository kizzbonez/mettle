mkdir -p hotel4/floors/1 "hotel4/floors/2/deep/store room" hotel4/floors/3
echo "31 lightbulb out" > hotel4/tickets.txt
printf 'URGENT: smoke alarm beeping\nstill URGENT at noon\n' > hotel4/floors/1/alarms.txt
echo "urgent in lower case does not count" > hotel4/floors/1/quiet.txt
echo "call the plumber, URGENT" > "hotel4/floors/2/deep/store room/water notes.txt"
echo "all fine" > hotel4/floors/3/fan.log

script="$PWD/solution.sh"
cd hotel4 || fail "could not go into hotel4"
printed=$(bash "$script" 2> ../errors4.txt)

urgent=$(printf '%s\n' "$printed" | sed -n '/^== urgent ==$/,${/^== /!p}')
assert_eq "$urgent" "floors/1/alarms.txt
floors/2/deep/store room/water notes.txt" "the paths under '== urgent ==' (files containing URGENT in capitals, each once, sorted)"
assert_eq "$(cat ../errors4.txt)" "" "what the script printed on standard error"
