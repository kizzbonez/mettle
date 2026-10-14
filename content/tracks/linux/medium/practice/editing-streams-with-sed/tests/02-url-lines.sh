# Two http:// on one url line, names that end in url and names that only contain it.
{
  printf 'url=http://a.example/one?next=http://a.example/two\n'
  printf 'upload_url=http://up.example/\n'
  printf 'homepage=http://home.example/\n'
  printf 'note=url=http://x.example/\n'
  printf 'mirror_url=https://already.example/\n'
  printf 'curl_opts=http://proxy.example/\n'
} > atrium.conf

bash solution.sh atrium.conf > /dev/null || fail "solution.sh exited with a non-zero status"

expected='url=https://a.example/one?next=https://a.example/two
upload_url=https://up.example/
homepage=http://home.example/
note=url=http://x.example/
mirror_url=https://already.example/
curl_opts=http://proxy.example/'
assert_eq "$(cat atrium.conf)" "$expected" "which lines get https:// and how many http:// are replaced on them"
