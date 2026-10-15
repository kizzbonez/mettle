# Malformed tokens, the alg header and the HMAC signature.
import base64
import hashlib
import hmac
import json

SECRET = b"council-test-secret-02"
NOW = 1800000000
CLAIMS = {"iss": "https://id.harrowvale.example", "sub": "u-2", "aud": "rota-web", "iat": NOW - 10,
          "exp": NOW + 300, "nonce": "n-2", "amr": ["pwd", "hwk"]}


def enc(data):
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def make(claims=CLAIMS, header=None, secret=SECRET, raw_header=None, raw_claims=None):
    head = raw_header if raw_header is not None else enc(json.dumps(header or {"alg": "HS256", "typ": "JWT"}).encode())
    body = raw_claims if raw_claims is not None else enc(json.dumps(claims).encode())
    signature = hmac.new(secret, f"{head}.{body}".encode(), hashlib.sha256).digest()
    return f"{head}.{body}.{enc(signature)}"


def reason(token):
    try:
        validate_id_token(token, SECRET, NOW, "n-2")
    except TokenError as error:
        return str(error)
    return "valid"


good = make()
assert reason(good) == "valid", "a correctly signed token with valid claims"
head, body, sig = good.split(".")

malformed = {
    "two parts": f"{head}.{body}",
    "four parts": f"{good}.{sig}",
    "an empty string": "",
    "a header that is not base64url": f"{head}!.{body}.{sig}",
    "base64 with padding": f"{head}=.{body}.{sig}",
    "a signature with + and /": f"{head}.{body}.{sig[:-2]}+/",
    "a header that is a JSON list": make(raw_header=enc(b'["alg", "HS256"]')),
    "a payload that is not JSON": make(raw_claims=enc(b"sub=u-2;aud=rota-web")),
    "a payload that is a JSON string": make(raw_claims=enc(b'"u-2"')),
}
for what, token in malformed.items():
    assert reason(token) == "malformed", f"validate_id_token for a token with {what}"

for alg in ["none", "None", "hs256", "HS512", "RS256", None]:
    header = {"typ": "JWT"} if alg is None else {"alg": alg, "typ": "JWT"}
    assert reason(make(header=header)) == "bad-alg", f"validate_id_token for alg {alg!r} (correct HMAC signature)"
unsigned = f"{enc(json.dumps({'alg': 'none'}).encode())}.{body}."
assert reason(unsigned) == "bad-alg", "validate_id_token for an unsigned alg none token"

assert reason(make(secret=b"another-clients-secret")) == "bad-signature", "a token signed with another secret"
assert reason(f"{head}.{body}.") == "bad-signature", "an HS256 token with an empty signature"
assert reason(f"{head}.{body}.{sig[:20]}") == "bad-signature", "a truncated signature"
edited = enc(json.dumps({**CLAIMS, "sub": "u-1"}).encode())
assert reason(f"{head}.{edited}.{sig}") == "bad-signature", "a payload edited after signing"
