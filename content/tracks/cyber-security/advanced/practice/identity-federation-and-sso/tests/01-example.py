# The example from the instructions.
SECRET = b"hv-rota-2026-Qm9Xc2lQ"
NOW = 1793088000

tokens = {}
with open("data/tokens.txt") as handle:
    for line in handle:
        if line.strip() and not line.startswith("#"):
            label, token = line.split()
            tokens[label] = token


def outcome(token, now=NOW, nonce="n-7Rk2pQ"):
    try:
        return validate_id_token(token, SECRET, now, nonce)
    except TokenError as error:
        return f"TokenError({str(error)!r})"


claims = outcome(tokens["good"])
assert claims == {"iss": "https://id.harrowvale.example", "sub": "u-40917", "aud": "rota-web",
                  "iat": 1793087940, "exp": 1793088240, "nonce": "n-7Rk2pQ", "amr": ["pwd", "otp"],
                  "name": "Priya Natarajan"}, f"the good token should return its claims, got {claims!r}"
for label, reason in [("alg-none", "bad-alg"), ("tampered", "bad-signature"), ("payroll", "wrong-audience"),
                      ("password", "no-mfa")]:
    got = outcome(tokens[label])
    assert got == f"TokenError({reason!r})", f"the {label} token from data/tokens.txt, got {got}"
got = outcome(tokens["good"], nonce="n-other")
assert got == "TokenError('nonce-mismatch')", f"the good token with nonce n-other, got {got}"
got = outcome(tokens["good"], now=1793088300)
assert got == "TokenError('expired')", f"the good token at now = 1793088300, got {got}"
