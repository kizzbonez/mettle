var weighIn = new WeighIn();
Check.True(weighIn.Leader() is null, "there is no leader before any catch is recorded");
Check.True(weighIn.TotalFor("Ada") == 0, "an angler without a catch has a total of 0");

weighIn.ReadSheet("# no catches yet\nAda none\n");
Check.True(weighIn.Leader() is null, "a sheet with only notes and bad lines records no catch, so there is still no leader");

weighIn.ReadSheet("Bo 700\nAda 300\n");
Check.True(weighIn.Leader() == "Bo", "the angler with the greatest total leads");

List<string> second = weighIn.ReadSheet("Ada 400\nCy 50\n");
Check.True(second.Count == 0, "a second sheet without bad lines has no problems");
Check.True(weighIn.TotalFor("Ada") == 700, "a second sheet adds to the totals of the first");
Check.True(weighIn.Leader() == "Ada", "on a tie, the name that comes first alphabetically leads");
Check.True(weighIn.TotalFor("ada") == 0 && weighIn.TotalFor("ADA") == 0, "names are compared exactly, as they are written");

weighIn.ReadSheet("Cy 1000\nDev 1\n");
Check.True(weighIn.TotalFor("Cy") == 1050 && weighIn.Leader() == "Cy", "a later catch can change the leader");
