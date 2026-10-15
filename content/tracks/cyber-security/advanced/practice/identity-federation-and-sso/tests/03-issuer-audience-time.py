# Issuer, audience with azp, and the exp and iat boundaries with LEEWAY.
import base64
import hashlib
import hmac
import json

SECRET = b"council-test-secret-03"
NOW = 1800000000
BASE = {"iss": "https://id.harrowvale.example", "sub": "u-3", "aud": "rota-web", "iat": NOW - 10,
        "exp": NOW + 300, "nonce": "n-3", "amr": ["otp"]}


def enc(data):
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def make(claims):
    signing = f"{enc(json.dumps({'alg': 'HS256', 'typ': 'JWT'}).encode())}.{enc(json.dumps(claims).encode())}"
    return f"{signing}.{enc(hmac.new(SECRET, signing.encode(), hashlib.sha256).digest())}"


def reason(changes, drop=()):
    claims = {key: value for key, value in {**BASE, **changes}.items() if key not in drop}
    try:
        validate_id_token(make(claims), SECRET, NOW, "n-3")
    except TokenError as error:
        return str(error)
    return "valid"


cases = [
    ({"iss": "https://id.harrowvale.example/"}, (), "wrong-issuer", "an issuer with a trailing slash"),
    ({"iss": "https://ID.harrowvale.example"}, (), "wrong-issuer", "an issuer in different case"),
    ({}, ("iss",), "wrong-issuer", "a token without iss"),
    ({"aud": ["rota-web"]}, (), "valid", "aud as a list with only this client"),
    ({"aud": ["payroll-web", "rota-web"], "azp": "rota-web"}, (), "valid", "two audiences with azp naming this client"),
    ({"aud": ["payroll-web", "rota-web"]}, (), "wrong-audience", "two audiences without azp"),
    ({"aud": ["payroll-web", "rota-web"], "azp": "payroll-web"}, (), "wrong-audience", "two audiences with azp naming the other client"),
    ({"azp": "payroll-web"}, (), "wrong-audience", "one audience with azp naming another client"),
    ({"azp": "rota-web"}, (), "valid", "one audience with azp naming this client"),
    ({"aud": "rota-web-admin"}, (), "wrong-audience", "an audience that only starts with the client ID"),
    ({}, ("aud",), "wrong-audience", "a token without aud"),
    ({"exp": NOW - 59}, (), "valid", "exp 59 seconds ago, inside the leeway"),
    ({"exp": NOW - 60}, (), "expired", "exp exactly 60 seconds ago"),
    ({}, ("exp",), "expired", "a token without exp"),
    ({"iat": NOW + 60}, (), "valid", "iat 60 seconds in the future, inside the leeway"),
    ({"iat": NOW + 61}, (), "not-yet-valid", "iat 61 seconds in the future"),
    ({"iss": "https://evil.example", "exp": NOW - 3600}, (), "wrong-issuer", "a wrong issuer and an old exp: the first failing check"),
    ({"aud": "payroll-web", "iat": NOW + 600}, (), "wrong-audience", "a wrong audience and a future iat: the first failing check"),
]
for changes, drop, expected, what in cases:
    assert reason(changes, drop) == expected, f"validate_id_token for {what}"
