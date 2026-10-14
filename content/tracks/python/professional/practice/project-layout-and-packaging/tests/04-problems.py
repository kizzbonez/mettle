# problems: each rule, missing tables, dynamic versions, markers and the order of the messages.
import tomllib

GOOD = '''
[build-system]
requires = ["flit_core >= 3.12"]
build-backend = "flit_core.buildapi"

[project]
name = "tidepool"
dynamic = ["version"]
dependencies = ["numpy >= 2", "tzdata; os_name == 'nt'", "attrs ~= 25.1"]

[project.optional-dependencies]
plots = ["matplotlib == 3.10.0"]

[project.scripts]
tidepool = "tidepool.cli:main"
tide-table = "tidepool.tables.print_table:run"

[dependency-groups]
test = ["pytest == 9.0.0"]
'''
found = problems(tomllib.loads(GOOD))
assert found == [], f"a complete file with a dynamic version, ranges, extras and groups should have no problems, not {found}"

found = problems({})
assert found == ["no build backend", "no name", "no version"], (
    f"an empty file should report the backend, the name and the version, in that order, not {found}"
)

ONLY_REQUIRES = '''
[build-system]
requires = ["setuptools >= 77"]

[project]
name = "kettle"
version = "1.5.0rc1"
'''
found = problems(tomllib.loads(ONLY_REQUIRES))
assert found == ["no build backend", "bad version '1.5.0rc1'"], (
    f"a build-system table without build-backend and a pre-release version: got {found}"
)

MESSY = '''
[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[project]
version = "2.0"
dynamic = ["readme"]
dependencies = [
    "requests==2.32.3",
    "colorama >= 0.4; os_name == 'nt'",
    "pywin32 == 311; sys_platform == 'win32'",
    "rich >= 13",
]

[project.scripts]
good = "pkg.cli:main"
no-colon = "pkg.cli.main"
two-colons = "pkg:cli:main"
no-function = "pkg.cli:"
no-module = ":main"
"émoji-rápido" = "pkg.fast"
'''
expected = [
    "no name",
    "pinned dependency 'requests==2.32.3'",
    "pinned dependency 'pywin32 == 311; sys_platform == 'win32''",
    "bad script 'no-colon'",
    "bad script 'two-colons'",
    "bad script 'no-function'",
    "bad script 'no-module'",
    "bad script 'émoji-rápido'",
]
found = problems(tomllib.loads(MESSY))
assert found == expected, (
    "a file without a name, with pinned dependencies (one with a marker) and several broken scripts "
    f"should list each problem once, in the order of the rules and of the file; got {found}"
)

NO_VERSION = '''
[build-system]
build-backend = "uv_build"

[project]
name = "lantern"
dynamic = ["readme", "description"]
'''
found = problems(tomllib.loads(NO_VERSION))
assert found == ["no version"], f"a version that is neither given nor listed in dynamic: got {found}"
