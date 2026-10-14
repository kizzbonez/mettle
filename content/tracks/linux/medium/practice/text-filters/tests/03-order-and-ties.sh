# Repeated titles that are not next to each other, and a three-way tie for third place.
{
  printf 'date,member,title\n'
  for title in rebecca persuasion emma rebecca kim persuasion rebecca emma persuasion kim rebecca middlemarch; do
    printf '2026-05-01,M9,%s\n' "$title"
  done
  printf '2026-05-02,M7,Kim\n'
  printf '2026-05-02,M7,Middlemarch\n'
} > spring-loans.csv

actual=$(bash solution.sh spring-loans.csv) || fail "solution.sh exited with a non-zero status"
assert_eq "$actual" '      4 rebecca
      3 kim
      3 persuasion' "counting titles spread through the file, and ordering titles with equal counts"

# Twelve loans of one title and nine of another: the counts must be compared as numbers.
{
  printf 'date,member,title\n'
  for n in 1 2 3 4 5 6 7 8 9; do printf '2026-06-0%s,M1,The Hours\n' "$n"; done
  for n in 1 2 3 4 5 6 7 8 9 10 11 12; do printf '2026-06-%s,M2,Atonement\n' "$n"; done
  printf '2026-06-30,M3,The Hound\n'
  printf '2026-06-30,M3,The Hours\n'
  printf '2026-06-30,M4,The Hound\n'
} > summer-loans.csv

actual=$(bash solution.sh summer-loans.csv) || fail "solution.sh exited with a non-zero status"
assert_eq "$actual" '     12 atonement
     10 the hours
      2 the hound' "ordering counts of different widths, and titles that contain spaces"
