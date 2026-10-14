# The script part on empty input, notes with nothing usable, and awkward line numbering.
ran = run_script(stdin="")
assert ran.code == 0, f"with empty input the script should finish without an error, but it stopped with:\n{ran.err}"
assert ran.out == "no singers counted\n", "the script's output for empty input"

ran = run_script(stdin="# just a note\n\n     \n   # an indented note, with a comma, 3\n")
assert ran.code == 0, f"with only comments and blank lines the script should not fail:\n{ran.err}"
assert ran.out == "no singers counted\n", "comments, indented comments and blank lines should all be skipped"

ran = run_script(stdin="\n\n# notes\ntenors two\n,3\n")
assert ran.code == 0, f"notes with only bad lines should not make the script fail:\n{ran.err}"
assert ran.out == (
    "line 4: expected 'section, count'\n"
    "line 5: section is missing\n"
    "no singers counted\n"
), "line numbers must count skipped lines too, and all-bad notes still end with the report"

notes = "  Altos , 1\n\n altos,4\n# break\nALTOS, 2\nbasses, 4\nbasses, x\ntenors, 4"
ran = run_script(stdin=notes)
assert ran.code == 0, f"the script should not fail on these notes:\n{ran.err}"
assert ran.out == (
    "line 7: count is not a whole number\n"
    "altos: 4\n"
    "basses: 4\n"
    "tenors: 4\n"
    "sections: 3, singers: 12\n"
    "largest section: altos (4)\n"
), "notes with mixed capitals, spaces, a bad line, a three-way tie and no newline after the last line"
