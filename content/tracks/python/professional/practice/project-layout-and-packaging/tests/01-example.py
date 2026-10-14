# The example from the instructions: data/birdcount.toml and a few versions.
import tomllib

with open("data/birdcount.toml", "rb") as file:
    project = tomllib.load(file)

expected = ["pinned dependency 'click == 8.1.7'", "bad script 'birdcount-report'"]
found = problems(project)
assert found == expected, f"problems() for data/birdcount.toml should be {expected}, not {found}"

assert version_tuple("1.10.0") == (1, 10, 0), "version_tuple('1.10.0') should be (1, 10, 0)"
assert allows(">= 1.4", "1.10.0") is True, "allows('>= 1.4', '1.10.0') should be True (compare numbers, not text)"
assert allows("~= 1.4.2", "1.5.0") is False, "allows('~= 1.4.2', '1.5.0') should be False"
assert allows("== 1.4", "1.4.0") is True, "allows('== 1.4', '1.4.0') should be True (pad with zeros)"
