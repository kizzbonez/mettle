"""A tiny linter with two rules, N802 and E711, that respects # noqa comments."""
import ast


class Checker(ast.NodeVisitor):
    """Collect (line, column, code, message) tuples while walking a syntax tree."""

    def __init__(self):
        self.found = []

    def report(self, node, code, message):
        """Remember one problem at NODE's position."""
        self.found.append((node.lineno, node.col_offset, code, message))

    # YOUR CODE: visit_FunctionDef and visit_AsyncFunctionDef for N802, visit_Compare for E711.
    # Call self.generic_visit(node) at the end of each.


def lint(source):
    """Return the problems in SOURCE as 'line N: CODE MESSAGE' strings, sorted."""
    checker = Checker()
    checker.visit(ast.parse(source))
    # YOUR CODE: drop the problems silenced by '# noqa: CODE' on their line, sort, and format.
    raise NotImplementedError
