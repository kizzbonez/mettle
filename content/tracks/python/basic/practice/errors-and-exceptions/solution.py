# Pocket Calculator
#
# calculate works out one line such as "12 / 4". The script part below it
# reads lines until the input ends and prints each result or what went wrong.


def calculate(line):
    """Return the result of a line such as "12 / 4" as a float, or raise an exception."""
    parts = line.split()
    if len(parts) != 3:
        raise ValueError("expected a number, an operator and a number")
    left_text, operator, right_text = parts
    if operator not in ("+", "-", "*", "/"):
        raise ValueError(f"unknown operator {operator}")
    left = float(left_text)
    right = float(right_text)
    if operator == "+":
        return left + right
    if operator == "-":
        return left - right
    if operator == "*":
        return left * right
    return left / right


worked = 0
failed = 0
while True:
    try:
        line = input()
    except EOFError:
        break
    line = line.strip()
    if not line:
        continue
    try:
        result = calculate(line)
    except ZeroDivisionError:
        print(f"{line} -> cannot divide by zero")
        failed += 1
    except ValueError as error:
        print(f"{line} -> {error}")
        failed += 1
    else:
        print(f"{line} = {result:.2f}")
        worked += 1

print(f"{worked} worked, {failed} failed")
