def output(names, times):
    ran = run_script(stdin=f"{names}\n{times}\n")
    assert ran.code == 0, "the script runs to the end without an error"
    return ran.out


assert output("Ada Bo", "100") == "names and times do not match\n", "a missing time is reported and nothing else is printed"
assert output("Ada", "100 200") == "names and times do not match\n", "an extra time is reported and nothing else is printed"
assert output("", "100") == "names and times do not match\n", "times without any names do not match"
assert output("", "") == "no runners\n", "two empty lines mean there were no runners"
assert output("   ", "  ") == "no runners\n", "lines with only spaces mean there were no runners"
