mkdir -p store2/attic/trunk/gloves store2/attic/box
touch store2/attic/trunk/.inventory "store2/attic/trunk/.old list" "store2/attic/trunk/top hat.txt" store2/attic/trunk/Wig.txt

script="$PWD/solution.sh"
cd store2/attic/trunk || fail "could not go into store2/attic/trunk"
actual=$(bash "$script" 2> /dev/null)

here=$(printf '%s\n' "$actual" | sed -n '/^== here ==$/,/^== one level up ==$/{/^== /!p}')
assert_eq "$here" ".inventory
.old list
Wig.txt
gloves
top hat.txt" "the names under '== here ==' for a folder with hidden files, a subfolder and a name with a space"
