"""Release checklist for the coding club's pyproject.toml files."""


def version_tuple(text):
    """Return a release version such as "1.10.0" as a tuple of ints, (1, 10, 0).

    Raise ValueError unless every dot-separated part is made only of the digits 0 to 9.
    """
    # YOUR CODE: split at the dots, check each part, convert it with int().
    raise NotImplementedError


def allows(specifier, version):
    """Return True when VERSION satisfies one clause such as ">= 1.4" or "~=1.4.2"."""
    # YOUR CODE: find the operator (two-character ones first), read the version after it,
    # pad both tuples with zeros to the same length, and compare. Unknown operator: ValueError.
    raise NotImplementedError


def problems(project):
    """Return the checklist problems of a parsed pyproject.toml, as a list of strings."""
    # YOUR CODE: build-system, name, version, pinned dependencies, then console scripts.
    raise NotImplementedError
