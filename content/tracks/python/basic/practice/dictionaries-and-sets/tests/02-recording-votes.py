def club(members, *votes):
    ran = run_script(stdin=members + "\n" + "\n".join(votes) + "\nend\n")
    assert ran.code == 0, "the script runs to the end without an error"
    return ran.out


assert club("Ada, Bo", "Ada: Emma", "Ada: Dune", "Ada: Persuasion", "Bo: Emma") == (
    "emma: 1\n"
    "persuasion: 1\n"
    "winner: emma\n"
    "everyone voted\n"
), "a member who votes several times keeps only the last vote"

assert club("Ada, Bo", "Zed: Emma", "ada: Emma", "Bo: Emma") == (
    "not a member: Zed\n"
    "not a member: ada\n"
    "emma: 1\n"
    "winner: emma\n"
    "did not vote: Ada\n"
), "votes from people who are not members are reported and not counted, and names are matched with their capitals"

assert club("Ada, Bo", "Ada: Dune", "Finn: Emma", "Bo:Emma") == (
    "not a member: Finn\n"
    "dune: 1\n"
    "emma: 1\n"
    "winner: dune\n"
    "everyone voted\n"
), "a non-member's vote is not counted, and a vote with no space after the colon still counts"

assert club("Ada, Bo", "  Ada :   THE HOBBIT  ", "Bo: the Hobbit") == (
    "the hobbit: 2\n"
    "winner: the hobbit\n"
    "everyone voted\n"
), "spaces around the member and the book are ignored, and books are compared in lower case"
