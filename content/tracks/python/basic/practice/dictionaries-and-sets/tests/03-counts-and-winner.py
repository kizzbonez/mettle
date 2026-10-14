def club(members, *votes):
    ran = run_script(stdin=members + "\n" + "\n".join(votes) + "\nend\n")
    assert ran.code == 0, "the script runs to the end without an error"
    return ran.out.split("\n")


lines = club("A, B, C, D, E, F", "A: Rebecca", "B: Matilda", "C: Rebecca", "D: Beloved", "E: Matilda", "F: Rebecca")
assert lines[:3] == ["beloved: 1", "matilda: 2", "rebecca: 3"], "every book with its number of votes, in alphabetical order"
assert lines[3] == "winner: rebecca", "the winner is the book with the most votes"

lines = club("A, B, C, D", "A: Matilda", "B: Beloved", "C: Matilda", "D: Beloved")
assert lines[2] == "winner: beloved", "on a tie, the winner is the tied book that comes first alphabetically"

lines = club("A, B, C", "A: Rebecca", "B: Matilda", "C: Beloved")
assert lines[3] == "winner: beloved", "when every book has one vote, the first alphabetically wins"

lines = club("A, B, C", "A: Zazie", "B: Zazie", "C: Atonement")
assert lines[:3] == ["atonement: 1", "zazie: 2", "winner: zazie"], "a book late in the alphabet wins with more votes"

lines = club("Ana, Bea", "Ana: Cien Años", "Bea: CIEN AÑOS")
assert lines[:2] == ["cien años: 2", "winner: cien años"], "accented letters are lowered like any other"
