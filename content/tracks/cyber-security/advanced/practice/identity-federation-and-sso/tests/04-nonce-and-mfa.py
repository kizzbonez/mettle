# The nonce, the amr methods and the claims returned for a valid token.
import base64
import hashlib
import hmac
import json

SECRET = b"council-test-secret-04"
NOW = 1800000000
BASE = {"iss": "https://id.harrowvale.example", "sub": "u-4", "aud": "rota-web", "iat": NOW,
        "exp": NOW + 300, "nonce": "n-4", "amr": ["pwd", "otp"], "email": "k.osei@harrowvale.example"}


def enc(data):
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def make(claims):
    signing = f"{enc(json.dumps({'alg': 'HS256', 'typ': 'JWT'}).encode())}.{enc(json.dumps(claims).encode())}"
    return f"{signing}.{enc(hmac.new(SECRET, signing.encode(), hashlib.sha256).digest())}"


def reason(changes=None, drop=(), nonce="n-4"):
    claims = {key: value for key, value in {**BASE, **(changes or {})}.items() if key not in drop}
    try:
        validate_id_token(make(claims), SECRET, NOW, nonce)
    except TokenError as error:
        return str(error)
    return "valid"


assert reason(nonce="n-5") == "nonce-mismatch", "a token whose nonce is not the one the app sent"
assert reason(drop=("nonce",)) == "nonce-mismatch", "a token without a nonce claim"
assert reason({"nonce": "N-4"}) == "nonce-mismatch", "a nonce that differs only in case"
assert reason({"nonce": "n-other", "amr": ["pwd"]}) == "nonce-mismatch", "a wrong nonce and no MFA: the first failing check"

for amr in (["pwd"], [], ["pwd", "kba"], ["sms"]):
    assert reason({"amr": amr}) == "no-mfa", f"amr {amr} has no method from MFA_METHODS"
assert reason(drop=("amr",)) == "no-mfa", "a token without amr"
for amr in (["hwk"], ["mfa"], ["swk", "pwd"], ["pwd", "otp"]):
    assert reason({"amr": amr}) == "valid", f"amr {amr} includes a method from MFA_METHODS"

got = validate_id_token(make(BASE), SECRET, NOW, "n-4")
assert got == BASE, "a valid token returns its claims as a dict"
