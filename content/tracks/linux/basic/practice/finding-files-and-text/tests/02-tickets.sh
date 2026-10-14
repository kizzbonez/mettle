mkdir -p hotel2/floors/1
{
  echo "11 leak in room 11"
  echo "12 Leak. Bathroom done"
  echo "13 two leaks in the attic"
  echo "14 leaky gutter"
  echo "15 bleak view, guest unhappy"
  echo "16 LEAK, again done"
  echo "17 leak,leak twice on one line"
  echo "18 window rattles"
} > hotel2/tickets.txt
echo "quiet night" > hotel2/floors/1/night.log

script="$PWD/solution.sh"
cd hotel2 || fail "could not go into hotel2"
printed=$(bash "$script" 2> /dev/null)

leaks=$(printf '%s\n' "$printed" | sed -n '/^== leaks ==$/,/^== open ==$/{/^== /!p}')
assert_eq "$leaks" "4" "the number under '== leaks ==' (the whole word leak, any case, one count per line)"
open=$(printf '%s\n' "$printed" | sed -n '/^== open ==$/,/^== logs ==$/{/^== /!p}')
assert_eq "$open" "1:11 leak in room 11
3:13 two leaks in the attic
4:14 leaky gutter
5:15 bleak view, guest unhappy
7:17 leak,leak twice on one line
8:18 window rattles" "the numbered lines under '== open =='"
