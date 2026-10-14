assert name_key("  Zoë   MÜLLER ") == "zoë müller", "name_key('  Zoë   MÜLLER ') from the example"
assert name_key("Straße") == "strasse", "name_key('Straße') from the example"
assert fit_bytes("Zoë Müller", 3) == "Zo", "fit_bytes('Zoë Müller', 3) from the example"
assert fit_bytes("Zoë Müller", 4) == "Zoë", "fit_bytes('Zoë Müller', 4) from the example"
assert code_points("Zoë") == "U+005A U+006F U+00EB", "code_points('Zoë') from the example"
assert code_points("🎵") == "U+1F3B5", "code_points('🎵') from the example"
assert badge_line(7, "Zoë Müller", 1250.5) == "007 Zoë Müller            1,250.50", (
    "badge_line(7, 'Zoë Müller', 1250.5) from the example"
)
