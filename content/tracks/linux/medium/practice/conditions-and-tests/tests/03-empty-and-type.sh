# Empty files are rejected before their type is looked at.
: > blank.txt
: > tool.exe
for name in blank.txt tool.exe; do
  out=$(bash solution.sh "$name" 2> /dev/null)
  status=$?
  assert_eq "$out" "rejected: empty" "what is printed for an empty file called $name"
  assert_eq "$status" "1" "exit status for an empty file called $name"
done

# Names that are not an allowed kind.
for name in setup.exe notes.txt.bak README PHOTO.PNG; do
  printf 'some content\n' > "$name"
  out=$(bash solution.sh "$name" 2> /dev/null)
  status=$?
  assert_eq "$out" "rejected: type" "what is printed for a file called $name"
  assert_eq "$status" "1" "exit status for a file called $name"
done

# Allowed kinds, one with spaces in its name.
printf 'sunset\n' > 'holiday photo.jpg'
out=$(bash solution.sh 'holiday photo.jpg' 2> /dev/null)
status=$?
assert_eq "$out" "accepted: image" "what is printed for a small .jpg whose name contains spaces"
assert_eq "$status" "0" "exit status for a small .jpg whose name contains spaces"

printf '# My essay\n' > essay.md
out=$(bash solution.sh essay.md 2> /dev/null)
status=$?
assert_eq "$out" "accepted: text" "what is printed for a small .md file"
assert_eq "$status" "0" "exit status for a small .md file"
