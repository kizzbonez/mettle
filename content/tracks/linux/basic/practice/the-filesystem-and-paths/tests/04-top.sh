top="$PWD/deep4/Old Theatre/store"
mkdir -p "$top/shoes/boots" "$top/masks"
touch "$top/READ ME.txt" "$top/.keys" "$top/shoes/boots/left.txt"

script="$PWD/solution.sh"
cd "$top/shoes/boots" || fail "could not go into the test's working directory"
actual=$(bash "$script" 2> "$top/../errors4.txt") || fail "solution.sh finished with a non-zero exit status"

section=$(printf '%s\n' "$actual" | sed -n '/^== top ==$/,${/^== /!p}')
assert_eq "$section" "$top
READ ME.txt
masks/
shoes/" "the absolute path and the names under '== top ==' for a store whose path contains a space"
assert_eq "$(cat "$top/../errors4.txt")" "" "messages on standard error (a command complained)"
