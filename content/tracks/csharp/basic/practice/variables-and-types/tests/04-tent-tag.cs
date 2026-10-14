Check.True(Campsite.TentTag("Kofi", 1, 'A', false) == "Kofi | nights: 1 | field: A | dog: False",
    "the tag for a guest without a dog, where the bool prints with a capital letter");
Check.True(Campsite.TentTag("Lin Mei", 14, 'D', true) == "Lin Mei | nights: 14 | field: D | dog: True",
    "the tag uses the name, the nights and the field letter it is given");

string tag = Campsite.TentTag("Sam", 2, 'C', true);
Check.True(tag.Split(" | ").Length == 4, "the tag has four parts, separated by a space, a bar and a space");
Check.True(tag.StartsWith("Sam | ") && tag.Contains(" | nights: 2 | ") && tag.Contains(" | field: C | ") && tag.EndsWith(" | dog: True"),
    "the four parts are in the order of the instructions, each with its label");
