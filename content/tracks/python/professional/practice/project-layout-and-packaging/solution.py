"""Release checklist for the coding club's pyproject.toml files."""

OPERATORS = ("~=", ">=", "<=", "==", "!=", ">", "<")


def version_tuple(text):
    """Return a release version such as "1.10.0" as a tuple of ints, (1, 10, 0).

    Raise ValueError unless every dot-separated part is made only of the digits 0 to 9.
    """
    parts = text.split(".")
    for part in parts:
        if part == "" or any(char not in "0123456789" for char in part):
            raise ValueError(f"not a release version: {text!r}")
    return tuple(int(part) for part in parts)


def padded(numbers, size):
    """Return the tuple NUMBERS with zeros added at the end up to SIZE parts."""
    return numbers + (0,) * (size - len(numbers))


def allows(specifier, version):
    """Return True when VERSION satisfies one clause such as ">= 1.4" or "~=1.4.2"."""
    text = specifier.strip()
    for operator in OPERATORS:
        if text.startswith(operator):
            break
    else:
        raise ValueError(f"unknown operator in {specifier!r}")
    wanted = version_tuple(text[len(operator):].strip())
    have = version_tuple(version)
    size = max(len(wanted), len(have))
    left, right = padded(have, size), padded(wanted, size)
    if operator == "~=":
        if len(wanted) < 2:
            raise ValueError(f"~= needs at least two parts: {specifier!r}")
        return left >= right and left[: len(wanted) - 1] == wanted[:-1]
    if operator == ">=":
        return left >= right
    if operator == "<=":
        return left <= right
    if operator == "==":
        return left == right
    if operator == "!=":
        return left != right
    if operator == ">":
        return left > right
    return left < right


def is_object_reference(value):
    """Return True for a "module:function" console script value."""
    module, colon, function = value.partition(":")
    return colon == ":" and module != "" and function != "" and ":" not in function


def problems(project):
    """Return the checklist problems of a parsed pyproject.toml, as a list of strings."""
    found = []
    if "build-backend" not in project.get("build-system", {}):
        found.append("no build backend")
    metadata = project.get("project", {})
    if "name" not in metadata:
        found.append("no name")
    if "version" in metadata:
        try:
            version_tuple(metadata["version"])
        except ValueError:
            found.append(f"bad version '{metadata['version']}'")
    elif "version" not in metadata.get("dynamic", []):
        found.append("no version")
    for requirement in metadata.get("dependencies", []):
        if "==" in requirement.split(";")[0]:
            found.append(f"pinned dependency '{requirement}'")
    for name, value in metadata.get("scripts", {}).items():
        if not is_object_reference(value):
            found.append(f"bad script '{name}'")
    return found
