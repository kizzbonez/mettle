Check.True(SkiHill.RunLevel("green") == "beginner", "the level of a green run");
Check.True(SkiHill.RunLevel("blue") == "easy", "the level of a blue run");
Check.True(SkiHill.RunLevel("black") == "expert", "the level of a black run");
Check.True(SkiHill.RunLevel("purple") == "unknown", "a colour the hill does not use is unknown");
Check.True(SkiHill.RunLevel("") == "unknown", "an empty colour is unknown");
Check.True(SkiHill.RunLevel("Red") == "unknown", "a colour with a capital letter is unknown");

Check.True(SkiHill.OpenRunsSign(0) == "0 runs open", "the sign when no run is open uses the plural");
Check.True(SkiHill.OpenRunsSign(2) == "2 runs open", "the sign when two runs are open");
Check.True(SkiHill.OpenRunsSign(11) == "11 runs open", "the sign when eleven runs are open, which ends in 1 but is not one");
