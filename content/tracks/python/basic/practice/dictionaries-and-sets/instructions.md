The tests run your file as a script and type in the club's members on one line, separated by
commas, then one vote per line, `member: book`, until a line that says `end`. Every vote line
has exactly one colon. The starter reads the members into the set `members` and splits each
vote line at the colon into `member` and `book`. Write only where a comment says `YOUR CODE`.

1. **Record the vote.** Remove the spaces around `member` and `book`, and put the book in lower
   case. Member names are matched exactly, capitals included. If the member is not in
   `members`, print `not a member: <member>` and ignore the vote. Otherwise store the vote in the
   dictionary `votes`, which maps a member to a book: a member who votes again changes their
   vote, so only their last vote counts.
2. **Count and report.** At the end, count the votes for each book in a dictionary. Print one
   line `<book>: <votes>` per book, in alphabetical order, then `winner: <book>` for the book with
   the most votes. On a tie, the winner is the tied book that comes first alphabetically. If no
   vote was recorded at all, print only `no votes` for this part.
3. **Who did not vote.** Print `did not vote: ` followed by the members without a recorded vote,
   in alphabetical order, separated by a comma and a space; or `everyone voted` if there are
   none.

Example: with the input

```text
Ada, Bo, Cy, Di, Eve
Ada: Dune
Bo: The Hobbit
Cy:  dune
Finn: Emma
Bo: Dune
Di: the hobbit
end
```

the script prints:

```text
not a member: Finn
dune: 3
the hobbit: 1
winner: dune
did not vote: Eve
```

Bo changed his vote from The Hobbit to Dune, so Dune has three votes and The Hobbit one.

**Tips.** `counts.get(book, 0) + 1` counts, as in the lesson. Looping over `sorted(counts)` gives
the books in order; keep the best so far and replace it only when a book has **more** votes, so
the earlier one wins a tie, as in the lesson's practice answer 1. `set(votes)` is the set of the
members who voted, and set difference `-` gives those who did not.
