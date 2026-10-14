Check.True(EggFarm.CountFromNote("36") == 36, "a note that holds only a number");
Check.True(EggFarm.CountFromNote("  7") == 7, "spaces in front of the number are allowed");
Check.True(EggFarm.CountFromNote("0") == 0, "a note that says 0");
Check.True(EggFarm.CountFromNote("forty") == 0, "a number written in words is not a whole number");
Check.True(EggFarm.CountFromNote("") == 0, "an empty note is not a whole number");
Check.True(EggFarm.CountFromNote("4x2") == 0, "a note that mixes digits and letters is not a whole number");
Check.True(EggFarm.CountFromNote("12.5") == 0, "a number with a fractional part is not a whole number");
Check.True(EggFarm.CountFromNote("3000000000") == 0, "a number too large for an int is treated like any other bad note");
