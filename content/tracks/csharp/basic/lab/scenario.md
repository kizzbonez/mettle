The Maplewood Tool Library lends drills, saws, ladders and sanders to its members, so that a
street needs one ladder instead of forty. Volunteers run the lending desk on weekends and type
every transaction into a plain text log:

```text
# Saturday desk, volunteer: Priya
1 OUT drill-04 m1032
2 OUT LADDER-2 M2001
9 IN DRILL-04
```

A line says on which day of the season something happened, whether a tool went `OUT` to a member
or came back `IN`, and which tool and member it was. A loan lasts a fixed number of days. Every
day a tool is kept beyond that costs a small late fee, and a member may hold at most three tools.

Until now a spreadsheet macro read the log. It treated `drill-04` and `DRILL-04` as two
different drills, charged a day too much whenever a tool came back exactly on time, and stopped
with an error on the first line a tired volunteer had mistyped, so nothing after it was counted.

You are writing its replacement: a small C# library that knows the rules, and a replay method
that applies a whole log, skips what it should, and reports exactly which lines it could not
apply, so a volunteer can fix them, without ever crashing.
