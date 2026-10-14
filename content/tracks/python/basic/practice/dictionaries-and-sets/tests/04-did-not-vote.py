def club(members, *votes):
    ran = run_script(stdin=members + "\n" + "\n".join(votes) + "\nend\n")
    assert ran.code == 0, "the script runs to the end without an error"
    return ran.out


ran = run_script(stdin="Cy, Ada, Bo\nend\n")
assert ran.code == 0, "the script runs to the end without an error when nobody votes"
assert ran.out == "no votes\ndid not vote: Ada, Bo, Cy\n", "with no votes, every member is listed, in alphabetical order"

assert club("Eve, Di, Cy, Bo, Ada", "Cy: Emma").endswith("did not vote: Ada, Bo, Di, Eve\n"), (
    "the members without a vote are listed in alphabetical order, separated by a comma and a space"
)
assert club(" Ada ,Bo,   Cy  ", "Ada: Emma", "Bo: Emma", "Cy: Emma").endswith("everyone voted\n"), (
    "spaces around the members' names are ignored, and a club where all voted says so"
)
assert club("Ada, Bo", "Finn: Emma", "Gus: Dune") == (
    "not a member: Finn\n"
    "not a member: Gus\n"
    "no votes\n"
    "did not vote: Ada, Bo\n"
), "votes only from non-members leave the club with no votes"
