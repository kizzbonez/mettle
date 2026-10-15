# Token sources, old protocol versions, keys written into the configuration, and the order of codes.
for source in ["secrets", "os.urandom"]:
    assert weak_settings({"name": "s", "token_source": source}) == [], "secrets and os.urandom are good token sources"
for source in ["random", "time", "uuid1"]:
    assert weak_settings({"name": "s", "token_source": source}) == ["POOR-RANDOMNESS"], "any other token source is poor randomness"

assert weak_settings({"name": "s", "tls_versions": ["SSLv3", "TLSv1.2"]}) == ["DOWNGRADE-RISK"], "SSLv3 next to TLS 1.2 still allows a downgrade"
assert weak_settings({"name": "s", "tls_versions": ["TLSv1.1"]}) == ["DOWNGRADE-RISK"], "TLSv1.1 allows a downgrade"
assert weak_settings({"name": "s", "tls_versions": ["TLSv1.2", "TLSv1.3"]}) == [], "TLSv1.2 and TLSv1.3 are fine"
assert weak_settings({"name": "s", "tls_versions": []}) == [], "an empty version list has no old versions"

assert weak_settings({"name": "s", "key": "00ff00ff00ff00ff"}) == ["HARDCODED-KEY"], "a key written in the configuration is hardcoded"
assert weak_settings({"name": "s", "key": ""}) == [], "an empty key field holds no key"
assert weak_settings({"name": "s", "key_ref": "kms://pulse/s"}) == [], "a reference to a key in the KMS is not a hardcoded key"

everything = {
    "name": "worst",
    "key": "c0ffee",
    "tls_versions": ["TLSv1"],
    "token_source": "random",
    "signature_hash": "md5",
    "rsa_bits": 1024,
    "cipher": "DES-CBC",
}
assert weak_settings(everything) == [
    "WEAK-CIPHER", "SHORT-KEY", "WEAK-HASH", "POOR-RANDOMNESS", "DOWNGRADE-RISK", "HARDCODED-KEY"
], "codes are listed in the order of the instructions, whatever the order of the fields"
