# The example from the instructions: six codes, one of them typed with
# spaces around it. The test types them into your script.
codes = "6\n2580\n123\n12a4\n3456\n 7777 \n914702\n"
expected = (
    "2580: ok\n"
    "123: wrong length\n"
    "12a4: digits only\n"
    "3456: too easy\n"
    "7777: too easy\n"
    "914702: ok\n"
    "ok: 2, rejected: 4\n"
)

ran = run_script(stdin=codes)
assert ran.code == 0, f"the script should run to the end without an error, but it stopped with:\n{ran.err}"
assert ran.out == expected, (
    "the script's output for the example should match the instructions exactly.\n"
    f"Expected:\n{expected}\nGot:\n{ran.out}"
)
