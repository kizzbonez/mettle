"""Guest Book: the cottage's guest books, one text file per season."""

from pathlib import Path


def sign(path, name, message):
    """Add the line 'NAME: MESSAGE' at the end of the file, creating it if needed."""
    with open(path, "a", encoding="utf-8") as file:
        file.write(f"{name}: {message}\n")


def read_entries(path):
    """(name, message) for every 'NAME: MESSAGE' line; [] if the file does not exist."""
    entries = []
    try:
        with open(path, encoding="utf-8") as file:
            for line in file:
                line = line.strip()
                if not line or line.startswith("#") or ": " not in line:
                    continue
                name, _, message = line.partition(": ")
                entries.append((name, message))
    except FileNotFoundError:
        return []
    return entries


def new_book(folder, season):
    """Create FOLDER/SEASON.txt with mode 'x'; True if created, False if it already existed."""
    folder = Path(folder)
    folder.mkdir(parents=True, exist_ok=True)
    try:
        with open(folder / f"{season}.txt", "x", encoding="utf-8") as file:
            file.write(f"# Guest book {season}\n")
    except FileExistsError:
        return False
    return True


def seasons(folder):
    """The sorted names, without .txt, of the .txt files in folder."""
    return sorted(path.stem for path in Path(folder).glob("*.txt"))
