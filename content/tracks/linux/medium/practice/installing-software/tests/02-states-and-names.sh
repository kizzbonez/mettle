# Rows that are not installed, names that only start with or contain the wanted
# name, a name with + signs, and a description that mentions another package.
{
  printf 'Desired=Unknown/Install/Remove/Purge/Hold\n'
  printf '| Status=Not/Inst/Conf-files/Unpacked/halF-conf/Half-inst/trig-aWait/Trig-pend\n'
  printf '|/ Err?=(none)/Reinst-required (Status,Err: uppercase=bad)\n'
  printf '||/ Name           Version         Architecture Description\n'
  printf '+++-==============-===============-============-================================\n'
  printf 'ii  libssl3        3.0.15-1~deb12u1 amd64       Secure Sockets Layer toolkit, shared libraries\n'
  printf 'ii  libstdc++6     12.2.0-14       amd64        GNU Standard C++ Library v3\n'
  printf 'rc  postgresql-15  15.8-0+deb12u1  amd64        The World'"'"'s Most Advanced Open Source Relational Database\n'
  printf 'ii  python3-minimal 3.11.2-1+b1    amd64        minimal subset of the Python language\n'
  printf 'ii  python3-pip    23.0.1+dfsg-1   all          Python package installer for python3 3.11.2-1+b1\n'
  printf 'un  vim            <none>          <none>       (no description available)\n'
  printf 'ii  vim-tiny       2:9.0.1378-2    amd64        Vi IMproved, compact version\n'
} > build-07.txt

{
  printf 'postgresql-15 15.8-0+deb12u1\n'
  printf 'python3 3.11.2-1+b1\n'
  printf 'libssl 3.0.15-1~deb12u1\n'
  printf 'libstdc++6 12.2.0-14\n'
  printf 'vim 2:9.0.1378-2\n'
} > pins-07.txt

expected='postgresql-15: not installed
python3: not installed
libssl: not installed
libstdc++6: ok
vim: not installed
problems: 4'

actual=$(bash solution.sh build-07.txt pins-07.txt)
status=$?
assert_eq "$actual" "$expected" "rows that are not installed, and names that must match the whole name field"
assert_eq "$status" "1" "exit status when packages are missing"
