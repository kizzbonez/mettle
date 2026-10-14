# Ordering by hours as numbers, ties by name, and decimal formatting.
mkdir -p order
{
  printf '2026-09-08,Gus Ito,alpha,3\n'
  printf '2026-09-08,Gus Ito,beta,1.5\n'
  printf '2026-09-09,Gus Ito,beta,1.5\n'
  printf '2026-09-08,Gus Ito,gamma,9.5\n'
  printf '2026-09-08,Gus Ito,delta,10\n'
  printf '2026-09-08,Gus Ito,kappa,0.1\n'
  printf '2026-09-09,Gus Ito,kappa,0.1\n'
  printf '2026-09-10,Gus Ito,kappa,0.1\n'
  printf '2026-09-08,Gus Ito,omega,0\n'
} > order/gus.csv

actual=$(bash solution.sh order) || fail "solution.sh exited with a non-zero status"
assert_eq "$actual" 'delta 10.0
gamma 9.5
alpha 3.0
beta 3.0
kappa 0.3
omega 0.0
total 25.8
rejected 0' "projects ordered by hours as numbers, ties by name, one decimal place"

# Folders with nothing to report.
mkdir -p empty quiet
printf 'date,employee,project,hours\n# nothing this month\n\n' > quiet/none.csv
for folder in empty quiet; do
  actual=$(bash solution.sh "$folder") || fail "a folder with no valid records must still exit with status 0"
  assert_eq "$actual" 'total 0.0
rejected 0' "a folder with no valid records"
done

# Bad arguments.
printf 'not a folder\n' > plain.txt
for args in none plain.txt no-such-folder; do
  if [ "$args" = none ]; then
    out=$(bash solution.sh 2> err.txt)
  else
    out=$(bash solution.sh "$args" 2> err.txt)
  fi
  status=$?
  assert_eq "$status" "2" "exit status when the argument is '$args'"
  assert_eq "$out" "" "standard output when the argument is '$args'"
  assert_eq "$(cat err.txt)" "usage: solution.sh DIRECTORY" "message on standard error when the argument is '$args'"
done
