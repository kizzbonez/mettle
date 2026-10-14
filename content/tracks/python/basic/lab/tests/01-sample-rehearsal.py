# The example from the instructions, typed into the script.
notes = (
    "# Thursday rehearsal, Riverside hall\n"
    "altos, 2\n"
    "Basses, 1\n"
    "second  sopranos, 6\n"
    "altos, 3\n"
    "tenors, four\n"
    "\n"
    "baritones, 0\n"
    "basses, 2\n"
    "tenors\n"
    "altos, 1\n"
)
expected = (
    "line 6: count is not a whole number\n"
    "line 8: count must be at least 1\n"
    "line 10: expected 'section, count'\n"
    "altos: 3\n"
    "basses: 2\n"
    "second sopranos: 6\n"
    "sections: 3, singers: 11\n"
    "largest section: second sopranos (6)\n"
)

ran = run_script(stdin=notes)
assert ran.code == 0, f"the script should finish without an error, but it stopped with:\n{ran.err}"
assert ran.out == expected, (
    "the script's output should match the example in the instructions exactly.\n"
    f"Expected:\n{expected}\nGot:\n{ran.out}"
)
