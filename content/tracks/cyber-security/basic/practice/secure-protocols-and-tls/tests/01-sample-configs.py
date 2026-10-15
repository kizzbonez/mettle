# The example from the instructions: the two Encore configurations.
ran = run_script(args=["data/encore-nginx.conf"])
assert ran.out == (
    "PROTOCOL TLSv1 deprecated\n"
    "PROTOCOL TLSv1.1 deprecated\n"
    "PROTOCOL TLSv1.3 missing\n"
    "CIPHER ECDHE-RSA-AES128-SHA256 not-aead\n"
    "CIPHER AES128-GCM-SHA256 no-forward-secrecy\n"
    "CIPHER DES-CBC3-SHA des\n"
    "CIPHER RC4-SHA rc4\n"
), f"python solution.py data/encore-nginx.conf should print the findings in order, got:\n{ran.out}{ran.err}"
assert ran.code == 1, f"exit status when there are findings: got {ran.code}"

ran = run_script(args=["data/encore-hardened.conf"])
assert ran.out == "OK\n", f"python solution.py data/encore-hardened.conf should print OK, got:\n{ran.out}{ran.err}"
assert ran.code == 0, f"exit status when there are no findings: got {ran.code}"
