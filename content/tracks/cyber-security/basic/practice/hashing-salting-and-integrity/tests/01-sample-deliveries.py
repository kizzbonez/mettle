# The example from the instructions.
key = load_key("data/webhook-key.txt")
ping = b'{"event": "ping"}'
header = sign(key, ping)
assert header == "sha256=209c7fd72598b2bd798fb14d4f1d2478208e106b2154611444f521f178f9e2bf", (
    f"sign(key, {ping!r}) with the key in data/webhook-key.txt: got {header!r}"
)
assert verify(key, ping, header) is True, "verify should accept the header sign made for the same body"
assert verify(key, b'{"event": "pong"}', header) is False, "verify should refuse a header made for another body"

results = audit("data/deliveries.log", key)
expected = [(2, "OK"), (3, "OK"), (4, "FORGED"), (6, "WEAK"), (7, "OK"), (8, "FORGED")]
assert results == expected, f"audit of data/deliveries.log: got {results!r}"
