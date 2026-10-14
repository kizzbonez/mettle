var weighIn = new WeighIn();
string sheet =
    "Ada 0\n" +              // line 1
    "Ada 12.5\n" +           // line 2
    "Ada heavy\n" +          // line 3
    "Ada 99999999999\n" +    // line 4
    "2400 Ada\n" +           // line 5
    "Ada 1\n" +              // line 6
    "Ada 500 g\n" +          // line 7
    "Ada\n";                 // line 8
List<string> problems = weighIn.ReadSheet(sheet);

Check.True(problems.Count == 7, "every bad line gives exactly one problem, and the good line gives none");
Check.True(problems.Count > 0 && problems[0] == "line 1: '0' is not a weight", "a weight of 0 grams is not a weight");
Check.True(problems.Count > 1 && problems[1] == "line 2: '12.5' is not a weight", "a weight with a fractional part is not a weight");
Check.True(problems.Count > 2 && problems[2] == "line 3: 'heavy' is not a weight", "a word in place of the weight is not a weight");
Check.True(problems.Count > 3 && problems[3] == "line 4: '99999999999' is not a weight", "a number too large for an int is not a weight");
Check.True(problems.Count > 4 && problems[4] == "line 5: 'Ada' is not a weight", "the weight is the second field, so a name there is not a weight");
Check.True(problems.Count > 5 && problems[5] == "line 7: expected a name and a weight", "a line with three fields is a problem");
Check.True(problems.Count > 6 && problems[6] == "line 8: expected a name and a weight", "a line with one field is a problem");

Check.True(weighIn.TotalFor("Ada") == 1, "only the good line is added to the angler's total");
Check.True(weighIn.TotalFor("2400") == 0, "a rejected line adds nothing to anyone");
