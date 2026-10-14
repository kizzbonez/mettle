def report(stdin):
    ran = run_script(stdin=stdin)
    assert ran.code == 0, "the script runs to the end without an error"
    lines = ran.out.split("\n")
    assert len(lines) == 5, "the script prints exactly four lines"
    return lines


lines = report("48\n6\n2.5\n")
assert lines[0] == "Full boxes: 8", "the full boxes when the cookies fill the boxes exactly, printed as a whole number"
assert lines[1] == "Left over: 0", "nothing is left over when the cookies fill the boxes exactly"

lines = report("100\n7\n1\n")
assert lines[0] == "Full boxes: 14", "the full boxes when some cookies are left over"
assert lines[1] == "Left over: 2", "the cookies left over after the full boxes are packed"

lines = report("5\n12\n3\n")
assert lines[0] == "Full boxes: 0", "fewer cookies than fit in one box fill no box"
assert lines[1] == "Left over: 5", "fewer cookies than fit in one box are all left over"
