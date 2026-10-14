"""Requirements Check: compare installed versions with a requirements file."""


def version_numbers(text):
    """'2.32.3' becomes [2, 32, 3]."""
    return [int(part) for part in text.split(".")]


def padded(numbers, length):
    """The list of numbers with zeros added until it has length items."""
    return numbers + [0] * (length - len(numbers))


def parse_requirements(text):
    """A dict from each lower-case name to its specifier, spaces removed."""
    requirements = {}
    for line in text.split("\n"):
        line = line.split("#")[0].strip()
        if not line:
            continue
        cut = len(line)
        for index, char in enumerate(line):
            if char in "=<>!~":
                cut = index
                break
        name = line[:cut].strip().lower()
        requirements[name] = "".join(line[cut:].split())
    return requirements


def clause_holds(clause, version):
    """Whether version satisfies one clause such as '>=2.0' or '==2.32.*'."""
    if clause.startswith("<"):
        operator, wanted_text = "<", clause[1:]
    else:
        operator, wanted_text = clause[:2], clause[2:]
    have = version_numbers(version)
    if wanted_text.endswith(".*"):
        prefix = version_numbers(wanted_text[:-2])
        return padded(have, len(prefix))[: len(prefix)] == prefix
    wanted = version_numbers(wanted_text)
    length = max(len(have), len(wanted))
    have_padded, wanted_padded = padded(have, length), padded(wanted, length)
    if operator == "==":
        return have_padded == wanted_padded
    if operator == "!=":
        return have_padded != wanted_padded
    if operator == ">=":
        return have_padded >= wanted_padded
    if operator == "<":
        return have_padded < wanted_padded
    prefix = wanted[:-1]
    return have_padded >= wanted_padded and padded(have, len(prefix))[: len(prefix)] == prefix


def allows(specifier, version):
    """Whether version satisfies every comma-separated clause of specifier."""
    if not specifier:
        return True
    for clause in specifier.split(","):
        if not clause_holds(clause, version):
            return False
    return True


def problems(text, installed):
    """'NAME: not installed' or 'NAME: VERSION does not match SPECIFIER', in file order."""
    found = []
    for name, specifier in parse_requirements(text).items():
        if name not in installed:
            found.append(f"{name}: not installed")
        elif not allows(specifier, installed[name]):
            found.append(f"{name}: {installed[name]} does not match {specifier}")
    return found
