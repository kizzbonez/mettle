# Whole files: commented-out directives, quoted values, look-alike directives, no cipher list.
with open("t4-a.conf", "w", encoding="utf-8") as f:
    f.write(
        "server {\n"
        "    #ssl_protocols SSLv3 TLSv1;\n"
        "    # ssl_ciphers RC4-SHA:DES-CBC3-SHA;\n"
        "    ssl_protocols   TLSv1.2    TLSv1.3 ;\n"
        "    ssl_prefer_server_ciphers off;\n"
        '    ssl_ciphers "ECDHE-RSA-AES128-GCM-SHA256:!aNULL:ECDHE-RSA-CHACHA20-POLY1305:AES128-SHA";\n'
        "}\n"
    )
assert audit("t4-a.conf") == ["CIPHER AES128-SHA no-forward-secrecy"], (
    "commented-out directives are ignored, exclusions give nothing, and the weak suite at the end is reported"
)

with open("t4-b.conf", "w", encoding="utf-8") as f:
    f.write("server {\n    ssl_protocols TLSv1.2 TLSv1.3;\n}\n")
assert audit("t4-b.conf") == [], "a configuration without ssl_ciphers has no cipher findings"
ran = run_script(args=["t4-b.conf"])
assert ran.out == "OK\n" and ran.code == 0, "a configuration without findings prints OK and exits with status 0"

with open("t4-c.conf", "w", encoding="utf-8") as f:
    f.write("server {\n    listen 443 ssl;\n    ssl_ciphers ECDHE-ECDSA-AES128-SHA256:RC4-MD5;\n}\n")
assert audit("t4-c.conf") == [
    "PROTOCOL TLSv1.2 missing",
    "PROTOCOL TLSv1.3 missing",
    "CIPHER ECDHE-ECDSA-AES128-SHA256 not-aead",
    "CIPHER RC4-MD5 rc4",
], "a configuration without ssl_protocols lacks both versions, and protocol findings come before cipher findings"
