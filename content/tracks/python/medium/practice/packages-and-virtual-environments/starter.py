"""Requirements Check: compare installed versions with a requirements file.

Every `raise NotImplementedError` marks code you still have to write. Keep the
three function names and their parameters: the tests call them. You may add
helper functions, for example one that turns "2.32.3" into [2, 32, 3].
"""


def parse_requirements(text):
    """A dict from each lower-case name to its specifier, spaces removed."""
    raise NotImplementedError


def allows(specifier, version):
    """Whether version satisfies every comma-separated clause of specifier."""
    raise NotImplementedError


def problems(text, installed):
    """'NAME: not installed' or 'NAME: VERSION does not match SPECIFIER', in file order."""
    raise NotImplementedError
