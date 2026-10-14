cp data/lobby.conf lobby.conf

out=$(bash solution.sh lobby.conf) || fail "solution.sh exited with a non-zero status for lobby.conf"
assert_eq "$out" "" "what solution.sh prints on standard output"

expected='name=Lobby screen #1
url=https://cdn.example.org/lobby/playlist.json
fallback_url=https://cdn.example.org/static/fallback.png
expires=2026-12-31
renewed=03/02/2026
volume=40
note=old manual at http://wiki.example.org/players'
assert_eq "$(cat lobby.conf)" "$expected" "the contents of lobby.conf after the migration"

[ -f lobby.conf.bak ] || fail "lobby.conf.bak was not created"
cmp -s lobby.conf.bak data/lobby.conf || fail "lobby.conf.bak does not hold the original text"
