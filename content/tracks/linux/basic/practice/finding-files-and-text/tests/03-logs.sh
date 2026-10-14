mkdir -p hotel3/floors/1 hotel3/floors/2/old.log hotel3/floors/3/east/wing
echo "21 door sticks" > hotel3/tickets.txt
echo "this file is not under floors" > hotel3/stray.log
echo "heater on" > hotel3/floors/1/heater.log
echo "March" > hotel3/floors/2/old.log/march.txt
echo "guest note" > "hotel3/floors/2/room 12.log"
echo "fan noisy" > hotel3/floors/3/east/wing/fan.log
echo "capitals" > hotel3/floors/3/east/BIG.LOG
echo "packed" > hotel3/floors/3/east/fan.log.gz

script="$PWD/solution.sh"
cd hotel3 || fail "could not go into hotel3"
printed=$(bash "$script" 2> /dev/null)

logs=$(printf '%s\n' "$printed" | sed -n '/^== logs ==$/,/^== urgent ==$/{/^== /!p}')
assert_eq "$logs" "floors/1/heater.log
floors/2/room 12.log
floors/3/east/wing/fan.log" "the paths under '== logs ==' (regular files ending in .log, at any depth, sorted)"
