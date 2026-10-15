# control_value: ALE before minus ALE after minus the annual cost, rounded to 2 decimals.
cases = [
    ((2_000_000, 0.25, 0.05, 0.05, 0.05, 10_000), 10000.0, "the lesson's flood barriers"),
    ((500_000, 0.20, 0.10, 0.10, 0.05, 15_000), -7500.0, "a control that costs more than it saves"),
    ((1_800, 1.0, 12, 1.0, 3, 5_000), 11200.0, "a control that only lowers how often the loss happens"),
    ((250_000, 0.50, 0.20, 0.50, 0.20, 4_000), -4000.0, "a control that changes nothing"),
]
for args, expected, what in cases:
    got = control_value(*args)
    assert abs(got - expected) < 1e-9, f"control_value for {what}"

got = control_value(333_333, 0.3, 0.3, 0.1, 0.1, 0)
assert abs(got - 26666.64) < 1e-9 and got == round(got, 2), "control_value should round the result to 2 decimals"
