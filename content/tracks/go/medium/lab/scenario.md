The Riverside Rowing Club tests its members on the rowing machines, the ergs, every couple of
weeks: each member rows 2,000 metres as fast as they can, and the coach writes the time on a
sheet as minutes, seconds and tenths, such as `7:12.4`. A volunteer types the sheets into a
spreadsheet and exports it as CSV, one line per test. Until now the leaderboard on the boathouse
wall was worked out by hand, and it went wrong in the usual ways: a typo such as `7:5.2` was
read as seven minutes and five seconds, a line without a name was counted for nobody in
particular, and two rowers with the same best time were ranked first and second depending on who
had been typed in first. The club's website wants the leaderboard as JSON. You are writing the
small Go package, `ergboard`, that both the website and the volunteer's command-line tool will
import: it reads the CSV from any `io.Reader`, says exactly which lines are wrong and why, keeps
every other line, ranks the members fairly and writes the JSON to any `io.Writer`.
