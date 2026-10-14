Every October the Hollins Lane nature group holds its Garden Bird Count. On Saturday morning,
volunteers sit at a window for an hour and note every bird that lands in their garden, the
allotments or the park. Each volunteer types their tally into a plain text sheet:

```text
# Garden bird count, Saturday 3 October 2026
# Volunteer: Ines, 12 Maple Close

07:02 blackbird 2
07:05 Blue Tit 4
07:26 wood  pigeon 3
07:31 robin one
```

A line gives the time, the species (one word or several) and how many birds were seen.
Volunteers write species in any mix of capitals and spacing, start their sheets with comment
lines, and make mistakes at seven in the morning: `robin one`, a time of `7:40`, a count that
was never filled in.

Until now one member added everything up by hand, and a sheet with a smudged line sometimes
went missing from the totals altogether. You are writing the module that replaces her: it
reads every sheet in the `data/` folder, keeps the lines it can read, reports exactly which
lines it could not read so a volunteer can fix them, and produces the totals the group
publishes in its newsletter.
