Write `validate_id_token(token, secret, now, nonce)` in `solution.py`. It returns the token's
claims (a `dict`) when the token is valid, and otherwise raises `TokenError(reason)` with the
**first** failing check below as its message, such as `TokenError("expired")`. `secret` is the
client secret as `bytes`, `now` is the time in seconds since 1970 (never read the clock) and
`nonce` is the value the app sent with its login request. Use the constants in the starter.

1. `malformed`: the token is not three parts separated by `.`, or a part is not valid base64url,
   or the header or payload is not a JSON **object**. `b64url_decode` (given) decodes one part
   and raises `ValueError` if it is not base64url; `json.loads` raises `ValueError` too.
2. `bad-alg`: the header's `alg` is not exactly `"HS256"`. Never accept `"none"`.
3. `bad-signature`: the third part, decoded, is not the HMAC-SHA256 of the ASCII text
   `<part 1>.<part 2>` (as received) with `secret`. Compare with `hmac.compare_digest`.
4. Then the claims, as OpenID Connect Core section 3.1.3.7 lists them. A missing claim fails its
   check.
   - `wrong-issuer`: `iss` is not `ISSUER`.
   - `wrong-audience`: `aud` (a string or a list) does not contain `CLIENT_ID`, or there is an
     `azp` claim or more than one audience and `azp` is not `CLIENT_ID`.
   - `expired`: `now` is at or after `exp + LEEWAY` (`LEEWAY` is 60 seconds of clock skew).
   - `not-yet-valid`: `iat` is after `now + LEEWAY`.
   - `nonce-mismatch`: the `nonce` claim is not the `nonce` argument.
   - `no-mfa`: `amr` (a list of authentication methods) has none of `MFA_METHODS`.

**Example.** `data/tokens.txt` holds five tokens captured at `now = 1793088000`
(2026-10-27 08:00 UTC), signed with the secret `b"hv-rota-2026-Qm9Xc2lQ"`. With
`nonce = "n-7Rk2pQ"`:

```text
good       returns {'iss': 'https://id.harrowvale.example', 'sub': 'u-40917', 'aud': 'rota-web',
           'iat': 1793087940, 'exp': 1793088240, 'nonce': 'n-7Rk2pQ', 'amr': ['pwd', 'otp'],
           'name': 'Priya Natarajan'}
alg-none   TokenError('bad-alg')
tampered   TokenError('bad-signature')       the payload was edited after signing
payroll    TokenError('wrong-audience')      issued to payroll-web
password   TokenError('no-mfa')              amr is ['pwd']
```

The `good` token with `nonce = "n-other"` raises `TokenError('nonce-mismatch')`, and at
`now = 1793088300` (its `exp` plus 60) it raises `TokenError('expired')`.

**Tips.** `token.split(".")` gives the parts. `hmac.new(secret, data, hashlib.sha256).digest()`
computes the HMAC. `isinstance(aud, str)` tells a single audience from a list.
