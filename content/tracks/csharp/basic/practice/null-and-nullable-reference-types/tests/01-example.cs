// The example from the instructions. Some calls pass null, and some answers
// are null, which the test compares like any other value.
Check.Equal(HostelDesk.CallName("Margaret", "Peggy"), "Peggy", "the name used for Margaret, whose nickname is Peggy");
Check.Equal(HostelDesk.CallName("Tomas", null), "Tomas", "the name used for Tomas, who has no nickname");

Dictionary<string, string> beds = new() { ["Peggy"] = "3a" };
Check.Equal(HostelDesk.BedOf(beds, "Peggy"), "3a", "Peggy's bed");
Check.Equal(HostelDesk.BedOf(beds, "Tomas"), null, "the bed of Tomas, who has none yet");
Check.Equal(HostelDesk.BedLabel("3a"), "Bed 3A", "the label for bed 3a");
Check.Equal(HostelDesk.BedLabel(null), "No bed yet", "the label when there is no bed");

Check.Equal(HostelDesk.AverageRating([4, null, 5]), 4.5, "the average of the ratings 4, missing and 5");
Check.Equal(HostelDesk.AverageRating([null, null]), null, "the average when both ratings are missing");
