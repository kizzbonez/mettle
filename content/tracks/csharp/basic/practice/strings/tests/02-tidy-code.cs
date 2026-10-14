Check.True(PostOffice.TidyCode("AB-1-FR") == "AB-1-FR", "a code that is already tidy stays as it is");
Check.True(PostOffice.TidyCode("ab-1-fr") == "AB-1-FR", "every letter of the code is converted to upper case");
Check.True(PostOffice.TidyCode("   xy-77-it") == "XY-77-IT", "the spaces in front of the code are removed");
Check.True(PostOffice.TidyCode("Xy-77-iT    ") == "XY-77-IT", "the spaces after the code are removed");
Check.True(PostOffice.TidyCode("\tcd-5-es\n") == "CD-5-ES", "a tab or a line break around the code is removed like a space");
Check.True(PostOffice.TidyCode(" a b ") == "A B", "a space inside the code is kept, only the ones around it go");
