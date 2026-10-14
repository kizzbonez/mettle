"""A tiny linter with two rules, N802 and E711, that respects # noqa comments."""
import ast

NOQA = "# noqa:"


def is_none(node):
    """Return True when NODE is the constant None."""
    return isinstance(node, ast.Constant) and node.value is None


class Checker(ast.NodeVisitor):
    """Collect (line, column, code, message) tuples while walking a syntax tree."""

    def __init__(self):
        self.found = []

    def report(self, node, code, message):
        """Remember one problem at NODE's position."""
        self.found.append((node.lineno, node.col_offset, code, message))

    def visit_FunctionDef(self, node):
        if node.name != node.name.lower():
            self.report(node, "N802", f"function name '{node.name}' should be lowercase")
        self.generic_visit(node)

    visit_AsyncFunctionDef = visit_FunctionDef

    def visit_Compare(self, node):
        operands = [node.left, *node.comparators]
        for index, operator in enumerate(node.ops):
            left, right = operands[index], operands[index + 1]
            if isinstance(operator, (ast.Eq, ast.NotEq)) and (is_none(left) or is_none(right)):
                self.report(node, "E711", "comparison to None should use 'is' or 'is not'")
                break
        self.generic_visit(node)


def silenced(line, code):
    """Return True when LINE has a '# noqa:' comment listing CODE."""
    if NOQA not in line:
        return False
    codes = line.split(NOQA, 1)[1].replace(",", " ").split()
    return code in codes


def lint(source):
    """Return the problems in SOURCE as 'line N: CODE MESSAGE' strings, sorted."""
    checker = Checker()
    checker.visit(ast.parse(source))
    lines = source.splitlines()
    return [
        f"line {line}: {code} {message}"
        for line, column, code, message in sorted(checker.found)
        if not silenced(lines[line - 1], code)
    ]
