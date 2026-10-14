"""Link Builder: build the library newsletter's links."""


def link(host, /, *path, secure=True, **query):
    """https://HOST/PATH/PARTS?KEY=VALUE&KEY=VALUE (http:// when secure is false)."""
    scheme = "https" if secure else "http"
    address = f"{scheme}://{host}/" + "/".join(str(part) for part in path)
    if query:
        address += "?" + "&".join(f"{key}={value}" for key, value in query.items())
    return address


def link_from(parts, options):
    """The link built from parts = [host, path part, ...] and a dict of keyword arguments."""
    return link(*parts, **options)


def apply_steps(text, *steps):
    """Apply each step function in turn, starting with text."""
    for step in steps:
        text = step(text)
    return text


def remember(url, history=None):
    """Append url to history (a new list when none is given) and return the list."""
    if history is None:
        history = []
    history.append(url)
    return history
