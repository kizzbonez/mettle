# Book Club Vote
#
# The tests run this script and type into it the club's members on one line,
# separated by commas, then one vote per line, "member: book", until a line
# that says end. The first lines below read the members into a set and each
# vote into `member` and `book`. Write only where a comment says YOUR CODE.

members = set()
for name in input().split(","):
    members.add(name.strip())

votes = {}   # member -> book

while True:
    line = input().strip()
    if line == "end":
        break
    member, book = line.split(":")

    # YOUR CODE (task 1): clean up member and book, then record the vote in
    # `votes`, or report a voter who is not a member.

# YOUR CODE (task 2): count the votes for each book in a dictionary, then
# print the counts and the winner, or "no votes".

# YOUR CODE (task 3): print the members who did not vote, or "everyone voted".
