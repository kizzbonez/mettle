def stops_with_value_error(stdin):
    ran = run_script(stdin=stdin)
    return ran.code != 0 and "ValueError" in ran.err


assert stops_with_value_error("40\n12.5\n2\n"), "a tip rate that is not a whole number stops the script with a ValueError"
assert stops_with_value_error("40\n10\n2.5\n"), "a number of people that is not a whole number stops the script with a ValueError"
assert stops_with_value_error("40\n10\ntwo\n"), "a number of people written as a word stops the script with a ValueError"
assert stops_with_value_error("12,50\n10\n2\n"), "a bill with a decimal comma stops the script with a ValueError"
assert stops_with_value_error("40\n\n2\n"), "an empty line where the tip rate should be stops the script with a ValueError"
