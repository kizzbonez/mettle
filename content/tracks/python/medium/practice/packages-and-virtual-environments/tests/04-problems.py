text = """
# the planting planner, season 2027
Flask~=3.1.0
pandas >=2.1, !=2.2.0   # 2.2.0 broke the charts
pillow
tomli_w==1.2.*
"""
installed = {"flask": "3.2.0", "pandas": "2.2.0", "pillow": "11.0.0", "tomli_w": "1.2.7", "numpy": "2.3.1"}
assert problems(text, installed) == [
    "flask: 3.2.0 does not match ~=3.1.0",
    "pandas: 2.2.0 does not match >=2.1,!=2.2.0",
], "problems reports each version that is not allowed, in the order of the file, with the specifier as parsed"

assert problems(text, {}) == [
    "flask: not installed",
    "pandas: not installed",
    "pillow: not installed",
    "tomli_w: not installed",
], "every requirement missing from installed is reported, in the order of the file"

all_good = {"flask": "3.1.4", "pandas": "2.3", "pillow": "10.4.0", "tomli_w": "1.2"}
assert problems(text, all_good) == [], "nothing is reported when every requirement is met"
assert problems("# nothing yet\n", installed) == [], "a file without requirements has no problems"
assert problems("NumPy<2\n", {"numpy": "2.3.1"}) == ["numpy: 2.3.1 does not match <2"], (
    "a requirement written with capitals is looked up by its lower-case name"
)
