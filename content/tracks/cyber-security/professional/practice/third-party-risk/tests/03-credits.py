# service_credit: every band of clause 2.2 and its boundaries.
cases = [(100.0, 0), (99.9, 0), (99.899, 10), (99.0, 10), (98.999, 25), (95.0, 25), (94.999, 50), (0.0, 50)]
for percent, credit in cases:
    got = service_credit(percent)
    assert got == credit, f"the service credit for {percent} percent availability, at the edges of the bands"
