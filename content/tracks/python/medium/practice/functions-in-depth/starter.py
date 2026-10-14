"""Link Builder: build the library newsletter's links.

Every `raise NotImplementedError` marks code you still have to write. The tests
check the parameter lists, so keep them exactly as they are.
"""


def link(host, /, *path, secure=True, **query):
    """https://HOST/PATH/PARTS?KEY=VALUE&KEY=VALUE (http:// when secure is false)."""
    raise NotImplementedError


def link_from(parts, options):
    """The link built from parts = [host, path part, ...] and a dict of keyword arguments."""
    # YOUR CODE: call link, unpacking parts with * and options with **.
    raise NotImplementedError


def apply_steps(text, *steps):
    """Apply each step function in turn, starting with text."""
    raise NotImplementedError


def remember(url, history=None):
    """Append url to history (a new list when none is given) and return the list."""
    raise NotImplementedError
