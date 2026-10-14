text = """# requirements.txt for the planting planner
requests==2.32.3
NumPy >= 2.0, < 3   # arrays for the harvest charts
rich
"""

assert parse_requirements(text) == {"requests": "==2.32.3", "numpy": ">=2.0,<3", "rich": ""}, (
    "parse_requirements for the example file"
)
assert allows(">=2.0,<3", "2.3.1") is True, "allows('>=2.0,<3', '2.3.1') from the example"
assert allows(">=2.0,<3", "3.0") is False, "allows('>=2.0,<3', '3.0') from the example"
assert allows("~=1.4.2", "1.4.9") is True, "allows('~=1.4.2', '1.4.9') from the example"
assert allows("~=1.4.2", "1.5.0") is False, "allows('~=1.4.2', '1.5.0') from the example"
assert allows("==2.32.*", "2.32.5") is True, "allows('==2.32.*', '2.32.5') from the example"
assert problems(text, {"requests": "2.31.0", "numpy": "2.3.1"}) == [
    "requests: 2.31.0 does not match ==2.32.3",
    "rich: not installed",
], "problems for the example file and installed versions"
