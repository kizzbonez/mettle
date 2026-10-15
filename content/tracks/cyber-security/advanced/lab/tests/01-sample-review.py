# The sample review from the instructions: every finding for the files in data/, in order.
ran = run_script()
expected = [
    "FW-BROAD 60",
    "FW-MGMT-EXPOSED 60 ports 22,23,161,3389,5900,5985,5986",
    "FW-SHADOWED 70 by 60",
    "FW-MGMT-EXPOSED 100 ports 3389",
    "FW-BROAD 110",
    "FW-SHADOWED 120 by 60",
    "FW-SHADOWED 130 by 10",
    "FW-SHADOWED 140 by 60",
    "FW-MGMT-EXPOSED 140 ports 22",
    "CT-ALL-INTERFACES booking/db 5432/tcp",
    "CT-PRIVILEGED booking/worker",
    "CT-PRIVILEGED monitoring/cadvisor",
    "CT-ALL-INTERFACES monitoring/cadvisor 8081/tcp",
    "CT-ALL-INTERFACES monitoring/grafana 3000/tcp",
    "ACCT-STALE jonas.weber 103",
    "ACCT-PRIVILEGED-USER lena.marsh",
    "ACCT-PRIVILEGED-SERVICE svc-backup",
    "ACCT-STALE svc-scanner never",
    "ACCT-STALE temp.locum 286",
    "ACCT-STALE kai.ng 91",
    "MAIL-SPF-MULTIPLE news.brightwater-vets.example",
    "MAIL-DMARC-NONE news.brightwater-vets.example",
    "MAIL-SPF-WEAK brightwater-pets.example +all",
    "MAIL-DMARC-MISSING brightwatervets.example",
    "TOTAL 24",
]
printed = ran.out.splitlines()
if printed != expected:
    missing = [line for line in expected if line not in printed]
    extra = [line for line in printed if line not in expected]
    raise AssertionError(
        "python solution.py should print exactly these lines, in this order:\n" + "\n".join(expected)
        + f"\n\nIt printed:\n{ran.out}{ran.err}"
        + f"\nMissing lines: {missing}\nUnexpected lines: {extra}"
    )
assert ran.code == 1, f"a review with findings should exit with status 1; it exited with {ran.code}"
