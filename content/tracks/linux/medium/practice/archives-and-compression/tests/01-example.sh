mkdir -p shoot/raw
cp data/contact-sheet.txt data/selects.txt shoot/
cp data/IMG_0412.txt data/IMG_0413.txt shoot/raw/

expected='shoot/contact-sheet.txt
shoot/raw/IMG_0412.txt
shoot/raw/IMG_0413.txt
shoot/selects.txt'

actual=$(bash solution.sh shoot) || fail "solution.sh exited with a non-zero status for the folder shoot"
assert_eq "$actual" "$expected" "the files listed from the archive of the folder shoot"

[ -f shoot.tar.gz ] || fail "shoot.tar.gz was not created"
[ -f shoot.tar.gz.sha256 ] || fail "shoot.tar.gz.sha256 was not created"
assert_eq "$(sha256sum -c shoot.tar.gz.sha256 2>&1)" "shoot.tar.gz: OK" "what sha256sum -c shoot.tar.gz.sha256 reports"
