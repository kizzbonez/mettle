def boxes_needed_line(cookies, box_size):
    ran = run_script(stdin=f"{cookies}\n{box_size}\n2.5\n")
    assert ran.code == 0, "the script runs to the end without an error"
    lines = ran.out.split("\n")
    assert len(lines) == 5, "the script prints exactly four lines"
    return lines[2]


assert boxes_needed_line(48, 6) == "Boxes needed: 8", "cookies that fill the boxes exactly need no extra box"
assert boxes_needed_line(49, 6) == "Boxes needed: 9", "a single cookie left over needs a box of its own"
assert boxes_needed_line(100, 7) == "Boxes needed: 15", "a few cookies left over need one more box"
assert boxes_needed_line(5, 12) == "Boxes needed: 1", "fewer cookies than fit in one box still need one box"
assert boxes_needed_line(0, 6) == "Boxes needed: 0", "no cookies need no boxes"
assert boxes_needed_line(1, 1) == "Boxes needed: 1", "boxes that hold one cookie each"
