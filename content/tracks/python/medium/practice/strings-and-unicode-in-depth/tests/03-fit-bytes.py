assert fit_bytes("Ana", 10) == "Ana", "text that fits is returned whole"
assert fit_bytes("Ana", 3) == "Ana", "text exactly limit bytes long fits"
assert fit_bytes("Ana", 0) == "", "a limit of 0 gives an empty text"
assert fit_bytes("", 5) == "", "an empty text stays empty"
assert fit_bytes("李小龙", 7) == "李小", "characters of three bytes are kept only while they fit whole"
assert fit_bytes("李小龙", 9) == "李小龙", "nine bytes hold three characters of three bytes"
assert fit_bytes("🎵 Ana", 3) == "", "a four-byte character is left out when only three bytes fit"
assert fit_bytes("🎵 Ana", 5) == "🎵 ", "a four-byte character fits in four bytes"
result = fit_bytes("Søren Kierkegaard", 6)
assert result == "Søren", "the limit counts bytes, not characters"
assert "�" not in fit_bytes("Zoë", 2), "no replacement character appears where a character was cut"
for limit in range(0, 25):
    piece = fit_bytes("Åsa Øberg 🎵 Zoë", limit)
    assert isinstance(piece, str), "fit_bytes returns a str"
    assert len(piece.encode("utf-8")) <= limit, "the result never takes more than limit bytes"
    assert "Åsa Øberg 🎵 Zoë".startswith(piece), "the result is always a start of the text"
