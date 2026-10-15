"""OpenID Connect ID-token validation for Harrow Vale Council's rota app (HS256, standard library)."""
import base64
import hashlib
import hmac
import json
import re

ISSUER = "https://id.harrowvale.example"
CLIENT_ID = "rota-web"
LEEWAY = 60                                   # seconds of allowed clock skew
MFA_METHODS = {"otp", "hwk", "swk", "mfa"}    # RFC 8176 method values that count as MFA


class TokenError(Exception):
    """Raised with the reason as its message, such as TokenError("expired")."""


def b64url_decode(part):
    """Decode one base64url part of a JWT (no padding); raise ValueError if it is not base64url."""
    if not re.fullmatch(r"[A-Za-z0-9_-]*", part):
        raise ValueError("not base64url")
    return base64.urlsafe_b64decode(part + "=" * (-len(part) % 4))


def decode_parts(token):
    parts = token.split(".")
    if len(parts) != 3:
        raise TokenError("malformed")
    try:
        header = json.loads(b64url_decode(parts[0]))
        claims = json.loads(b64url_decode(parts[1]))
        signature = b64url_decode(parts[2])
    except ValueError:
        raise TokenError("malformed") from None
    if not isinstance(header, dict) or not isinstance(claims, dict):
        raise TokenError("malformed")
    return parts, header, claims, signature


def audience_ok(claims):
    aud = claims.get("aud")
    audiences = [aud] if isinstance(aud, str) else aud if isinstance(aud, list) else []
    if CLIENT_ID not in audiences:
        return False
    if "azp" in claims or len(audiences) > 1:
        return claims.get("azp") == CLIENT_ID
    return True


def validate_id_token(token, secret, now, nonce):
    """Return the claims of a valid ID token; raise TokenError(reason) at the first failed check."""
    parts, header, claims, signature = decode_parts(token)
    if header.get("alg") != "HS256":
        raise TokenError("bad-alg")
    expected = hmac.new(secret, f"{parts[0]}.{parts[1]}".encode("ascii"), hashlib.sha256).digest()
    if not hmac.compare_digest(signature, expected):
        raise TokenError("bad-signature")

    if claims.get("iss") != ISSUER:
        raise TokenError("wrong-issuer")
    if not audience_ok(claims):
        raise TokenError("wrong-audience")
    if "exp" not in claims or now >= claims["exp"] + LEEWAY:
        raise TokenError("expired")
    if "iat" not in claims or claims["iat"] > now + LEEWAY:
        raise TokenError("not-yet-valid")
    if claims.get("nonce") != nonce:
        raise TokenError("nonce-mismatch")
    if not set(claims.get("amr", [])) & MFA_METHODS:
        raise TokenError("no-mfa")
    return claims
