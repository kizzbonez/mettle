# This test makes the hotel folder from the instructions, hotel1: it copies
# data/tickets.txt and builds the floors tree.
mkdir -p hotel1/floors/1 hotel1/floors/2
cp data/tickets.txt hotel1/
printf '07:00 pressure ok\n09:30 URGENT pressure low\n' > hotel1/floors/1/boiler.log
echo "check the boiler on Friday" > hotel1/floors/1/notes.txt
echo "lift serviced" > hotel1/floors/2/lift.log
echo "URGENT: room 204 flooded" > hotel1/floors/2/rooms.txt

# Then it goes into hotel1, runs your script there and shows you what it
# printed.
script="$PWD/solution.sh"
cd hotel1 || fail "could not go into hotel1"
printed=$(bash "$script" 2> ../errors1.txt)

echo "Your script printed:"
echo "$printed"
echo
echo "On standard error:"
cat ../errors1.txt
echo

expected='== leaks ==
3
== open ==
2:204 Leak under the sink
3:305 lightbulb out
4:112 leaky roof in corridor
6:318 door sticks
== logs ==
floors/1/boiler.log
floors/2/lift.log
== urgent ==
floors/1/boiler.log
floors/2/rooms.txt'
assert_eq "$printed" "$expected" "the morning report for the hotel in the instructions"
assert_eq "$(cat ../errors1.txt)" "" "what the script printed on standard error"
