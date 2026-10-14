ran = run_script(stdin="0\n")
assert ran.code == 0, "the script runs to the end without an error when there are no codes"
assert ran.out == "ok: 0, rejected: 0\n", "with no codes, only the count line is printed"

ran = run_script(stdin=" 1 \n8053\n")
assert ran.code == 0, "the script runs to the end without an error"
assert ran.out == "8053: ok\nok: 1, rejected: 0\n", "a single good code is counted as ok"

ran = run_script(stdin="3\n12\nabcd\n9999\n")
assert ran.code == 0, "the script runs to the end without an error"
assert ran.out.endswith("ok: 0, rejected: 3\n"), "codes that break different rules are all counted as rejected"

codes = ["8053", "1111", "70", "246810", "8053", "x9x9", "975312", "6789"]
ran = run_script(stdin=f"{len(codes)}\n" + "\n".join(codes) + "\n")
assert ran.code == 0, "the script runs to the end without an error"
lines = ran.out.split("\n")
assert len(lines) == len(codes) + 2, "one line per code, then the count line"
assert lines[-2] == "ok: 4, rejected: 4","the count line adds up every code, a code that comes twice counted twice"
