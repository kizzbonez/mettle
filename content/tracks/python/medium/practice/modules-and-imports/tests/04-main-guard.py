import random
import shutil
from pathlib import Path

# A raffle_data.py in the working folder comes before data/ on the module search path, so
# while it exists, `python solution.py` imports it instead of the organisers' example.
local_data = Path("raffle_data.py")


def fair_draw(tickets, prizes, seed):
    random.seed(seed)
    return list(zip(prizes, random.sample(tickets, min(len(prizes), len(tickets)))))


def expected_lines(tickets, prizes, seed):
    return "".join(f"{prize}: ticket {ticket}\n" for prize, ticket in fair_draw(tickets, prizes, seed))


def run_with(tickets, prizes, seed):
    local_data.write_text(f"TICKETS = {tickets!r}\nPRIZES = {prizes!r}\nSEED = {seed!r}\n", encoding="utf-8")
    shutil.rmtree("__pycache__", ignore_errors=True)
    return run_script()


assert printed_by(load_solution) == "", "importing solution.py prints nothing"

try:
    ran = run_with([501, 502, 503, 504, 505, 506], ["cake", "goldfish"], 99)
    assert ran.code == 0, f"python solution.py runs without an error; it said: {ran.err.strip()}"
    assert ran.out == expected_lines([501, 502, 503, 504, 505, 506], ["cake", "goldfish"], 99), (
        "run as a program, solution.py draws from raffle_data's TICKETS, PRIZES and SEED"
    )

    ran = run_with([8, 3], ["bike", "tent", "book bundle"], 4)
    assert ran.out == expected_lines([8, 3], ["bike", "tent", "book bundle"], 4), (
        "run as a program with fewer tickets than prizes, one line per ticket"
    )

    ran = run_with([1, 2, 3], [], 1)
    assert ran.code == 0 and ran.out == "", "run as a program with no prizes, solution.py prints nothing"
finally:
    local_data.unlink(missing_ok=True)
    shutil.rmtree("__pycache__", ignore_errors=True)
