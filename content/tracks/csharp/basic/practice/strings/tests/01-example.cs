// The example from the instructions, one method at a time.
Check.Equal(PostOffice.TidyCode("  pk-0042-de "), "PK-0042-DE", "the tidy form of the code \"  pk-0042-de \"");
Check.Equal(PostOffice.FileAs("Ada Okafor"), "OKAFOR, Ada", "what Ada Okafor's parcel is filed under");
Check.Equal(PostOffice.ShelfLine("Lagos", 3, 12.5m), "|Lagos     |   3|   12.50|",
    "the shelf line for 3 parcels to Lagos that weigh 12.5 kg");
Check.Equal(PostOffice.SameCity(" lagos", "LAGOS"), true, "whether \" lagos\" and \"LAGOS\" are the same city");
Check.Equal(PostOffice.SameCity("Lagos", "Accra"), false, "whether Lagos and Accra are the same city");
