assert list(Rota(["Ana", "Ben", "Cy"], 5)) == ["Ana", "Ben", "Cy", "Ana", "Ben"], "list(Rota(['Ana', 'Ben', 'Cy'], 5)), as in the example"
assert first_turns(["Ana", "Ben"], 3) == ["Ana", "Ben", "Ana"], "first_turns(['Ana', 'Ben'], 3), as in the example"
assert type(rota(["Ana"])).__name__ == "generator", "rota is a generator function, as in the example"
plan = schedule(["bins", "dishes", "hoover"], ["Ana", "Ben"])
assert next(plan) == "bins: Ana", "the first line of the example schedule"
assert list(plan) == ["dishes: Ben", "hoover: Ana"], "the rest of the example schedule"
