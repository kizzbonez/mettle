mkdir -p pool2
{
  echo "time,lane,swimmer"
  echo "06:00,1,Ana"
  echo "06:15,2,Ben"
  echo "06:30,3,Chen"
  echo "06:45,1,Dara"
  echo "07:00,2,Eli"
  echo "07:15,3,Femi"
  echo "07:30,1,Gus"
  echo "07:45,2,Hana"
  echo "08:00,3,Ivo"
  echo "08:15,1,Jun"
  echo "08:30,2,Kai"
  echo "08:45,3,Lia"
  echo "09:00,1,Mo"
  echo "09:15,2,Nia"
} > pool2/bookings.log
cp data/poster.png pool2/

script="$PWD/solution.sh"
cd pool2 || fail "could not go into pool2"
actual=$(bash "$script" 2> /dev/null)

header=$(printf '%s\n' "$actual" | sed -n '/^== header ==$/,/^== latest ==$/{/^== /!p}')
assert_eq "$header" "time,lane,swimmer" "the lines under '== header ==' for a log of fifteen lines"
latest=$(printf '%s\n' "$actual" | sed -n '/^== latest ==$/,/^== count ==$/{/^== /!p}')
assert_eq "$latest" "08:45,3,Lia
09:00,1,Mo
09:15,2,Nia" "the lines under '== latest ==' for a log of fifteen lines"
