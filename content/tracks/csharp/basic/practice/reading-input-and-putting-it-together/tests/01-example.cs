// The sheet from the instructions, read in one call. The comments give each
// line's number.
var weighIn = new WeighIn();
string sheet =
    "# Lake Ormond, Sunday\n" +   // line 1
    "Ada 2400\n" +                // line 2
    "Bo 950\n" +                  // line 3
    "\n" +                        // line 4
    "Ada 1200\n" +                // line 5
    "Cy two kilos\n" +            // line 6
    "Bo -300\n";                  // line 7

List<string> problems = weighIn.ReadSheet(sheet);
Check.SequenceEqual(problems, ["line 6: expected a name and a weight", "line 7: '-300' is not a weight"],
    "the problems ReadSheet finds in the sheet");
Check.Equal(weighIn.TotalFor("Ada"), 3600, "Ada's total from lines 2 and 5");
Check.Equal(weighIn.TotalFor("Bo"), 950, "Bo's total, without the bad line 7");
Check.Equal(weighIn.TotalFor("Cy"), 0, "the total of Cy, whose only line was bad");
Check.Equal(weighIn.Leader(), "Ada", "the leader after the sheet");
