# Book Club Vote
#
# The tests run this script and type into it the club's members on one line,
# separated by commas, then one vote per line, "member: book", until a line
# that says end.

members = set()
for name in input().split(","):
    members.add(name.strip())

votes = {}   # member -> book

while True:
    line = input().strip()
    if line == "end":
        break
    member, book = line.split(":")
    member = member.strip()
    book = book.strip().lower()
    if member in members:
        votes[member] = book
    else:
        print(f"not a member: {member}")

counts = {}
for book in votes.values():
    counts[book] = counts.get(book, 0) + 1

if counts:
    winner = ""
    for book in sorted(counts):
        print(f"{book}: {counts[book]}")
        if winner == "" or counts[book] > counts[winner]:
            winner = book
    print(f"winner: {winner}")
else:
    print("no votes")

missing = members - set(votes)
if missing:
    print(f"did not vote: {', '.join(sorted(missing))}")
else:
    print("everyone voted")
