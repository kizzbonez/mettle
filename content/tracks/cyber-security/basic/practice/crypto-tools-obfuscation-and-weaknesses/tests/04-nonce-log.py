# reused_nonces: per key, case and spaces ignored, each pair once, sorted, and an empty log.
with open("t4-encrypt.log", "w", encoding="utf-8") as f:
    f.write(
        "key_id,nonce,record\n"
        "k-b,aaaaaaaaaaaaaaaaaaaaaaaa,r1\n"
        "k-a,aaaaaaaaaaaaaaaaaaaaaaaa,r2\n"
        "k-b, AAAAAAAAAAAAAAAAAAAAAAAA ,r3\n"
        "k-b,aaaaaaaaaaaaaaaaaaaaaaaa,r4\n"
        " k-a ,bbbbbbbbbbbbbbbbbbbbbbbb,r5\n"
        "k-a,BBBBBBBBBBBBBBBBBBBBBBBB,r6\n"
        "k-c,cccccccccccccccccccccccc,r7\n"
    )
got = reused_nonces("t4-encrypt.log")
assert got == [("k-a", "bbbbbbbbbbbbbbbbbbbbbbbb"), ("k-b", "aaaaaaaaaaaaaaaaaaaaaaaa")], (
    "each reused (key, nonce) pair once, sorted, with spaces removed and nonces in lower case"
)

with open("t4-distinct.log", "w", encoding="utf-8") as f:
    f.write("key_id,nonce,record\nk-1,0f0f,r1\nk-2,0f0f,r2\nk-1,0f0e,r3\n")
assert reused_nonces("t4-distinct.log") == [], "the same nonce under different keys is not a reuse"

with open("t4-empty.log", "w", encoding="utf-8") as f:
    f.write("key_id,nonce,record\n")
assert reused_nonces("t4-empty.log") == [], "a log with no rows has no reuse"
