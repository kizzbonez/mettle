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


def validate_id_token(token, secret, now, nonce):
    """Return the claims of a valid ID token; raise TokenError(reason) at the first failed check."""
    # 1. malformed: three parts, base64url, header and payload JSON objects.
    # 2. bad-alg: header alg must be exactly HS256.
    # 3. bad-signature: HMAC-SHA256 of "part1.part2" with secret, hmac.compare_digest.
    # 4. wrong-issuer, wrong-audience, expired, not-yet-valid, nonce-mismatch, no-mfa.
    # YOUR CODE
    raise NotImplementedError
