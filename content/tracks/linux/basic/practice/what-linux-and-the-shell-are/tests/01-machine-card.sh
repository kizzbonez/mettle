# This test runs your script, shows you what it printed, and compares that
# with the card from the instructions.
actual=$(bash solution.sh)

echo "Your script printed:"
echo "$actual"
echo

expected='== Machine card ==
Kernel:
Linux
Operating system:
GNU/Linux
Distribution:
PRETTY_NAME="Debian GNU/Linux 12 (bookworm)"
NAME="Debian GNU/Linux"'
assert_eq "$actual" "$expected" "the card the script prints"
