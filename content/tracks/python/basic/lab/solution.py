# Choir Rehearsal Headcount: works out one rehearsal's attendance from the register notes.


def normalize_section(name):
    """Return name in lower case, with single spaces between its words and none around them."""
    words = name.lower().split()
    return " ".join(words)


def parse_headcount(line):
    """Return (section, count) from a line such as "First Sopranos, 2", or raise ValueError."""
    parts = line.split(",")
    if len(parts) != 2:
        raise ValueError("expected 'section, count'")
    section = normalize_section(parts[0])
    if section == "":
        raise ValueError("section is missing")
    try:
        count = int(parts[1].strip())
    except ValueError:
        raise ValueError("count is not a whole number")
    if count < 1:
        raise ValueError("count must be at least 1")
    return section, count


def record(tally, section, count):
    """Keep in tally the largest count of section seen at one time."""
    if section not in tally or count > tally[section]:
        tally[section] = count


def report_lines(tally):
    """Return the lines of the final report as a list of strings."""
    if not tally:
        return ["no singers counted"]
    lines = []
    total = 0
    largest = ""
    for section in sorted(tally):
        count = tally[section]
        lines.append(f"{section}: {count}")
        total += count
        if largest == "" or count > tally[largest]:
            largest = section
    lines.append(f"sections: {len(tally)}, singers: {total}")
    lines.append(f"largest section: {largest} ({tally[largest]})")
    return lines


tally = {}
line_number = 0
while True:
    try:
        line = input()
    except EOFError:
        break
    line_number += 1
    text = line.strip()
    if text == "" or text.startswith("#"):
        continue
    try:
        section, count = parse_headcount(text)
    except ValueError as error:
        print(f"line {line_number}: {error}")
    else:
        record(tally, section, count)

for report_line in report_lines(tally):
    print(report_line)
