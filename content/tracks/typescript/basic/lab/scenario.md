The Ridgeline climbing wall runs a bouldering league on the first Thursday of every month. A
round has a dozen short climbs, called **problems**, numbered P1, P2 and so on. A judge stands at
each problem and writes down how every climber did on it:

```text
# Ridgeline league, round 3
Ada P1 flash
ada P2 zone
Bo  P1 top
```

There are four results. A **flash** means the climber reached the top hold on the first try, a
**top** that they reached it in a later try, a **zone** that they only held the marked hold
halfway up, and a **miss** that they reached neither. Climbers who come back to a problem later
in the evening get a second line, and only their best result on each problem counts.

At the end of the night the scorer types the judges' sheets into one text file. Until now a
spreadsheet turned it into standings. It counted `Ada` and `ada` as two climbers, added up every
line instead of the best one per problem, and gave up silently when a tired judge wrote `lizard`
instead of `flash`, so the league table on the noticeboard was wrong more often than right.

You are writing its replacement: a small command-line program that reads the sheet from standard
input, checks every line, prints the standings, and reports exactly which lines it could not read
so that the scorer can fix them.
