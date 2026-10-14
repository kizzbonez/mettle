# N802: methods, nested and async functions, decorators, Unicode names, and names that are fine.
SOURCE = '''import functools


class ShelterReport:
    def __init__(self):
        self.rows = []

    def addRow(self, row):
        def Clean(value):
            return value.strip()
        self.rows.append(Clean(row))

    @functools.cache
    def total_2026(self):
        return len(self.rows)

    @staticmethod
    def FromCsv(text):
        return ShelterReport()


async def fetchPhotos(urls):
    async def DownloadOne(url):
        return url
    return [await DownloadOne(url) for url in urls]


def Größe():
    return 1


def _private_Helper():
    pass


def snake_case_2_ok(VALUE=None):
    CONSTANT = 3
    return lambda Item: Item


class lowercase_class_is_not_checked:
    pass
'''


def line_of(text):
    """The number of the line of SOURCE that contains TEXT."""
    return next(n for n, line in enumerate(SOURCE.splitlines(), start=1) if text in line)


expected = [
    f"line {line_of('def addRow')}: N802 function name 'addRow' should be lowercase",
    f"line {line_of('def Clean')}: N802 function name 'Clean' should be lowercase",
    f"line {line_of('def FromCsv')}: N802 function name 'FromCsv' should be lowercase",
    f"line {line_of('def fetchPhotos')}: N802 function name 'fetchPhotos' should be lowercase",
    f"line {line_of('def DownloadOne')}: N802 function name 'DownloadOne' should be lowercase",
    f"line {line_of('def Größe')}: N802 function name 'Größe' should be lowercase",
    f"line {line_of('def _private_Helper')}: N802 function name '_private_Helper' should be lowercase",
]
got = lint(SOURCE)
assert got == expected, (
    "N802 should report every def and async def with an upper-case letter, at any depth, on the line of its def, "
    "and nothing else; lint returned:\n" + "\n".join(map(str, got))
)
assert lint("") == [], "an empty source has no problems"
assert lint("def ok():\n    return None\n") == [], "a lower-case function with no comparison has no problems"
