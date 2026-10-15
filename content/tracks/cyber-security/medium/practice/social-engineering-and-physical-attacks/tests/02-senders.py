# red_flags(): lookalike domains and display names, from the From header only.
PASS = "mx1.brightwell-build.example; spf=pass smtp.mailfrom=x; dkim=pass; dmarc=pass"


def message(sender, subject="Weekly site report"):
    return (f"Authentication-Results: {PASS}\nFrom: {sender}\nTo: team@brightwell-build.example\n"
            f"Subject: {subject}\n\nSee attached.\n")


cases = [
    ("Omar Haddad <omar.haddad@BRIGHTWELL-BUILD.EXAMPLE>", [], "our own domain in upper case, with an executive's name"),
    ("Payroll <payroll@brightwe1l-build.example>", ["lookalike"], "a digit 1 in place of an l"),
    ("Payroll <payroll@brightwell-builds.example>", ["lookalike"], "one extra letter"),
    ("Payroll <payroll@Brightwel-Build.example>", ["lookalike"], "one missing letter, in mixed case"),
    ("Payroll <payroll@xn--brghtwell-build-82m.example>", ["lookalike"], "a homograph written in its xn-- form"),
    ("Payroll <payroll@mаil.partner.example>", ["lookalike"], "a Cyrillic letter in an unrelated domain"),
    ("Payroll <payroll@bryghtwell-bild.example>", [], "a domain two edits away"),
    ("Partner <info@partner.example>", [], "an unrelated domain"),
    ('"Ruth Calloway via DocuSign" <dse@docusign-mail.example>', ["display-name"], "an executive's name inside a longer display name"),
    ('"RUTH CALLOWAY" <ruth.calloway@gmail.example>', ["display-name"], "an executive's name in upper case"),
    ("Omar <omar@gmail.example>", [], "a first name alone is not an executive's name"),
    ('"Sam Mensah" <sam.mensah@brightwe11-build.example>', ["display-name"], "a name on a domain two edits away"),
    ('"Sam Mensah" <sam.mensah@brightwel-build.example>', ["display-name", "lookalike"], "a name on a typo domain"),
]
for sender, expected, what in cases:
    got = red_flags(message(sender))
    assert got == expected, f"red_flags: {what}"
