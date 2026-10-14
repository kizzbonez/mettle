var weighIn = new WeighIn();
string sheet =
    "# peg 4, morning\n" +            // line 1: a note
    "   # a note with 3 words\n" +    // line 2: a note after spaces
    "\n" +                            // line 3: blank
    "    \n" +                        // line 4: only spaces
    "Ada 100\n" +                     // line 5
    "#Bo 200\n" +                     // line 6: a note
    "   Bo    300   \n" +             // line 7: extra spaces
    "Cy\n";                           // line 8: one field
List<string> problems = weighIn.ReadSheet(sheet);
Check.True(problems.Count == 1, "notes, blank lines and lines of spaces are skipped without a problem");
Check.True(problems.Count == 1 && problems[0] == "line 8: expected a name and a weight",
    "every line is numbered, including the skipped ones");
Check.True(weighIn.TotalFor("Ada") == 100, "a good line after the skipped ones is added");
Check.True(weighIn.TotalFor("Bo") == 300, "spaces around a line and repeated spaces between its fields are ignored");
Check.True(weighIn.TotalFor("#Bo") == 0, "a note is skipped even when it looks like a catch");

var last = new WeighIn();
List<string> noFinalNewline = last.ReadSheet("Ada 5\nBo 7\nCy x");
Check.True(noFinalNewline.Count == 1 && noFinalNewline[0] == "line 3: 'x' is not a weight",
    "a last line without a line break at its end is still read and numbered");
Check.True(last.TotalFor("Bo") == 7, "every good line of a sheet is added");

Check.True(new WeighIn().ReadSheet("").Count == 0, "an empty sheet has no problems");
