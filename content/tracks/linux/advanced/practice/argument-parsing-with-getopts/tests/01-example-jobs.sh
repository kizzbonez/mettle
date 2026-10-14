printf 'pdf\n' > report.pdf
printf 'pdf\n' > 'q3 summary.pdf'

out=$(bash solution.sh -n -c 2 -s two report.pdf "q3 summary.pdf")
assert_eq "$?" "0" "exit status of the dry run from the example"
assert_eq "$out" "would queue report.pdf (copies=2, sides=two, printer=front-desk)
would queue q3 summary.pdf (copies=2, sides=two, printer=front-desk)" "the jobs printed for the example dry run"

out=$(bash solution.sh -c 2 -x report.pdf 2> err.txt)
assert_eq "$?" "2" "exit status for an unknown option"
assert_eq "$out" "" "nothing on standard output for an unknown option"
assert_eq "$(head -n 2 err.txt)" "lpjob: unknown option -x
Usage: lpjob [-hn] [-c COPIES] [-s SIDES] [-p PRINTER] [--] FILE..." \
  "the reason and the usage on standard error for an unknown option"
