Check.True(PostOffice.FileAs("Grace Hopper") == "HOPPER, Grace", "a parcel is filed under the surname in upper case, then the first name");
Check.True(PostOffice.FileAs("Li Na") == "NA, Li", "two short names are cut at the space between them");
Check.True(PostOffice.FileAs("kofi annan") == "ANNAN, kofi", "the first name is kept exactly as it was written");
Check.True(PostOffice.FileAs("Ada Okafor-Bello") == "OKAFOR-BELLO, Ada", "a surname with a hyphen is filed whole");

string filed = PostOffice.FileAs("Maria Lopez");
Check.True(!filed.StartsWith(' ') && !filed.EndsWith(' '), "the filed text has no space at either end");
Check.True(filed.Contains(", ") && !filed.Contains(",  "), "the comma is followed by exactly one space");
