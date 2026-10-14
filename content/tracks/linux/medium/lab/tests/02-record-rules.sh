# Windows line endings, including a blank line that is only a carriage return.
mkdir -p crlf
printf 'date,employee,project,hours\r\n2026-09-01,Dee Shah,apollo,4\r\n\r\n2026-09-01,Dee Shah,Apollo,1.5\r\n' > crlf/dee.csv

actual=$(bash solution.sh crlf) || fail "solution.sh exited with a non-zero status"
assert_eq "$actual" 'apollo 5.5
total 5.5
rejected 0' "a timesheet saved with Windows line endings"

# Lines to skip, and valid records written untidily.
mkdir -p tidy
{
  printf 'date,employee,project,hours\n'
  printf '\t# a comment after a tab\n'
  printf '   \n'
  printf '\t\n'
  printf ' date , employee , project , hours\n'
  printf '2026-09-02,Eli Novak,zephyr,0.5\n'
  printf ' 2026-09-03 ,\tEli Novak , ZEPHYR ,\t10 \n'
  printf '2026-09-04,Eli Novak,Zephyr,08\n'
} > tidy/eli.csv

actual=$(bash solution.sh tidy) || fail "solution.sh exited with a non-zero status"
assert_eq "$actual" 'zephyr 18.5
total 18.5
rejected 0' "blank lines, comments, headers, spaces and tabs around fields, and project case"

# One valid record among lines that break each rule.
mkdir -p broken
{
  printf '2026-09-05,Fay Lund,orion,2\n'
  printf '2026-09-05,Fay Lund,orion,.5\n'
  printf '2026-09-05,Fay Lund,orion,7.25\n'
  printf '2026-09-05,Fay Lund,orion,-2\n'
  printf '2026-09-05,Fay Lund,orion,\n'
  printf '2026-09-05,Fay Lund,orion,8h\n'
  printf '2026-9-05,Fay Lund,orion,1\n'
  printf '05/09/2026,Fay Lund,orion,1\n'
  printf '2026-09-05,Fay Lund,,3\n'
  printf '2026-09-05,Fay Lund,   ,3\n'
  printf '2026-09-05,Fay Lund,orion\n'
  printf '2026-09-05,Fay Lund,orion,1,5\n'
  printf 'see me about the orion hours\n'
} > broken/fay.csv

actual=$(bash solution.sh broken) || fail "solution.sh exited with a non-zero status"
assert_eq "$actual" 'orion 2.0
total 2.0
rejected 12' "records that break the date, project, hours or field-count rules are rejected"
