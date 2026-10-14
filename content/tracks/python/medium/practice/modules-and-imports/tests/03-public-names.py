import importlib
import math
from pathlib import Path

Path("stall_prices.py").write_text(
    '"""Prices at the cake stall."""\n'
    "CAKE = 1.5\n"
    "max_slices = 8\n"
    "_COST = 0.4\n"
    "__flavour__ = 'lemon'\n"
    "\n"
    "def price(slices):\n"
    "    return slices * CAKE\n"
    "\n"
    "def _margin():\n"
    "    return CAKE - _COST\n"
    "\n"
    "class Tray:\n"
    "    pass\n",
    encoding="utf-8",
)
Path("empty_stall.py").write_text('"""Nothing for sale yet."""\n', encoding="utf-8")
importlib.invalidate_caches()
import empty_stall
import stall_prices

names = public_names(stall_prices)
assert isinstance(names, list), "public_names returns a list"
assert "_COST" not in names and "_margin" not in names, "names with one leading underscore are left out"
assert "__flavour__" not in names and "__doc__" not in names, "names with two leading underscores are left out"
assert "max_slices" in names, "an underscore inside a name does not make it private"
assert names == ["CAKE", "Tray", "max_slices", "price"], "public_names keeps every public name, in the order dir() gives"
assert public_names(math) == [name for name in dir(math) if not name.startswith("_")], "public_names works on a standard module"
assert public_names(empty_stall) == [], "a module that defines nothing has no public names"
