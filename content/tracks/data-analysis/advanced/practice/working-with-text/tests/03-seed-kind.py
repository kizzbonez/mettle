import pandas as pd

answers = pd.Series(
    [
        "HEIRLOOM",
        "  op",
        "Open-Pollinated",
        "open    pollinated",
        "F1",
        "f1 Hybrid (bought)",
        "hybrid ",
        "heirloom (Gran's, 1950s)",
        "(op)",
        "",
        None,
        "heirloom tomato",
        "F1   HYBRID",
    ],
    index=range(100, 113),
    name="type",
)
before = answers.copy()
result = seed_kind(answers)
assert isinstance(result, pd.Series), "seed_kind returns a Series"
assert isinstance(result.dtype, pd.CategoricalDtype), "seed_kind returns a categorical Series"
assert result.cat.categories.tolist() == ["heirloom", "open-pollinated", "hybrid"], (
    "the categories are heirloom, open-pollinated and hybrid, in that order"
)
expected = pd.Series(
    pd.Categorical(
        [
            "heirloom",
            "open-pollinated",
            "open-pollinated",
            "open-pollinated",
            "hybrid",
            "hybrid",
            "hybrid",
            "heirloom",
            None,
            None,
            None,
            None,
            "hybrid",
        ],
        categories=["heirloom", "open-pollinated", "hybrid"],
    ),
    index=answers.index,
    name="kind",
)
check_frame(
    result,
    expected,
    "seed_kind normalises case and spaces, removes bracketed notes, maps the known spellings and leaves the rest missing",
)
check_frame(answers, before, "seed_kind does not change the answers")
