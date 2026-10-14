Dictionary<string, string> beds = new() { ["Ada"] = "1a", ["Bo"] = "12b", ["Cy"] = "7c" };
Check.True(HostelDesk.BedOf(beds, "Bo") == "12b", "a guest in the dictionary gets the bed stored for them");
Check.True(HostelDesk.BedOf(beds, "Cy") == "7c", "every guest gets their own bed");
Check.True(HostelDesk.BedOf(beds, "Dev") is null, "a guest who is not in the dictionary has no bed, without an exception");
Check.True(HostelDesk.BedOf(new Dictionary<string, string>(), "Ada") is null, "nobody has a bed in an empty dictionary");

Check.True(HostelDesk.BedLabel("12b") == "Bed 12B", "the label shows the bed in upper case");
Check.True(HostelDesk.BedLabel("  7c ") == "Bed 7C", "the label removes the spaces around the bed");
Check.True(HostelDesk.BedLabel("D4") == "Bed D4", "a bed already in upper case stays as it is");
Check.True(HostelDesk.BedLabel(null) == "No bed yet", "a missing bed gives the label for no bed");
Check.True(HostelDesk.BedLabel(HostelDesk.BedOf(beds, "Eli")) == "No bed yet",
    "the null from BedOf for a guest without a bed gives the label for no bed");
