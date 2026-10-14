ran = run_script(stdin="")
assert ran.code == 0, "with no input at all the script ends normally, without a traceback"
assert ran.out == "0 worked, 0 failed\n", "with no input at all only the counts are printed"

ran = run_script(stdin="\n   \n\t\n")
assert ran.code == 0, "the script ends normally on blank lines"
assert ran.out == "0 worked, 0 failed\n", "blank lines and lines of only spaces are skipped and not counted"

ran = run_script(stdin="8 / 0\n1 / 0\n0 / 0")
assert ran.code == 0, "the script carries on after a division by zero and ends normally"
assert ran.out == (
    "8 / 0 -> cannot divide by zero\n"
    "1 / 0 -> cannot divide by zero\n"
    "0 / 0 -> cannot divide by zero\n"
    "0 worked, 3 failed\n"
), "every division by zero is reported, the last line counts even without a newline after it"

ran = run_script(stdin="   9   *  -1.5  \n3 % 2\nx\n100 / 8\n")
assert ran.code == 0, "the script ends normally"
assert ran.out == (
    "9   *  -1.5 = -13.50\n"
    "3 % 2 -> unknown operator %\n"
    "x -> expected a number, an operator and a number\n"
    "100 / 8 = 12.50\n"
    "2 worked, 2 failed\n"
), "each line is echoed without the spaces around it, with its result to two decimals or its error message"
