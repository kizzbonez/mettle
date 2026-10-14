/**
 * `lab_helpers.py`, written next to the learner's file. Beginners write scripts
 * that read input and print as they run, so a test needs to run the whole file
 * as a program (`run_script`) or catch what one function prints (`printed_by`).
 */
export const PYTHON_HELPERS = `"""Helpers for lab tests: run the learner's program, or catch what a function prints."""
import contextlib
import importlib.util
import io
import subprocess
import sys


class Ran:
    """What one run of solution.py did: its output, its error output and its exit status."""

    def __init__(self, out, err, code):
        self.out = out
        self.err = err
        self.code = code

    def __repr__(self):
        return f"Ran(code={self.code!r}, out={self.out!r}, err={self.err!r})"


def run_script(stdin="", args=()):
    """Runs solution.py as a program, as \`python solution.py ARGS\` would, typing STDIN into it."""
    done = subprocess.run(
        [sys.executable, "solution.py", *args],
        input=stdin,
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    return Ran(done.stdout, done.stderr, done.returncode)


def printed_by(function, *args, stdin="", **kwargs):
    """Calls FUNCTION(*ARGS, **KWARGS) and returns what it printed. input() inside it reads STDIN."""
    saved = sys.stdin
    sys.stdin = io.StringIO(stdin)
    printed = io.StringIO()
    try:
        with contextlib.redirect_stdout(printed):
            function(*args, **kwargs)
    finally:
        sys.stdin = saved
    return printed.getvalue()


def load_solution():
    """Imports solution.py and returns what \`from solution import *\` would give.

    input() finds nothing to read during the import. A script that reads input as it
    starts stops there, keeping what it defined before; its tests run it with run_script.
    """
    spec = importlib.util.spec_from_file_location("solution", "solution.py")
    module = importlib.util.module_from_spec(spec)
    sys.modules["solution"] = module
    sys.stdin = io.StringIO("")
    try:
        spec.loader.exec_module(module)
    except EOFError:
        pass
    names = getattr(module, "__all__", None) or [name for name in vars(module) if not name.startswith("_")]
    return {name: getattr(module, name) for name in names}
`;
