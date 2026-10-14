# The checksum file must check the archive itself, and catch a damaged download.
mkdir -p portraits
printf 'sitter one\n' > portraits/one.txt
printf 'sitter two\n' > portraits/two.txt

bash solution.sh portraits > /dev/null || fail "solution.sh exited with a non-zero status"
[ -f portraits.tar.gz.sha256 ] || fail "portraits.tar.gz.sha256 was not created"
assert_eq "$(sha256sum -c portraits.tar.gz.sha256 2>&1)" "portraits.tar.gz: OK" \
  "what sha256sum -c reports for the untouched archive"

printf 'damage' >> portraits.tar.gz
if sha256sum -c portraits.tar.gz.sha256 > /dev/null 2>&1; then
  fail "the checksum file still passes after the archive was changed, so it does not check the archive"
fi
