def raised_by(line):
    """Calls calculate(line) and returns the type and the message of what it raised, or None."""
    try:
        calculate(line)
    except Exception as error:
        return type(error), str(error)
    return None


shape = (ValueError, "expected a number, an operator and a number")
assert raised_by("7") == shape, "a line with only one part raises ValueError with the message for the wrong shape"
assert raised_by("1 + 2 + 3") == shape, "a line with five parts raises ValueError with the message for the wrong shape"
assert raised_by("   ") == shape, "a line of only spaces raises ValueError with the message for the wrong shape"
assert raised_by("2 ^ 3") == (ValueError, "unknown operator ^"), "an operator that is not + - * / raises ValueError naming it"
assert raised_by("6 */ 2") == (ValueError, "unknown operator */"), "an operator made of two operator signs is unknown"
assert raised_by("a ^ b") == (ValueError, "unknown operator ^"), "the operator is checked before the numbers"
assert raised_by("ten * 2") == (ValueError, "could not convert string to float: 'ten'"), (
    "a number that float() cannot read raises float's own ValueError, unchanged"
)
assert raised_by("4 + four") == (ValueError, "could not convert string to float: 'four'"), (
    "a right-hand number that float() cannot read raises float's own ValueError"
)

divided = raised_by("5 / 0")
assert divided is not None and divided[0] is ZeroDivisionError, "dividing by zero raises ZeroDivisionError out of calculate"
divided = raised_by("0 / 0.0")
assert divided is not None and divided[0] is ZeroDivisionError, "dividing zero by zero raises ZeroDivisionError too"
