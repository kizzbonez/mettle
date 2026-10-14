Check.True(Campsite.NextPitchSign(0) == "Next free pitch: 1",
    "the sign when no pitch has been taken yet, so the last one taken is 0");
Check.True(Campsite.NextPitchSign(9) == "Next free pitch: 10",
    "the sign after pitch 9, where adding one gives a number with two digits");
Check.True(Campsite.NextPitchSign(99) == "Next free pitch: 100",
    "the sign after pitch 99, where adding one gives a number with three digits");
Check.True(Campsite.NextPitchSign(41).StartsWith("Next free pitch: "),
    "the sign keeps its words, a colon and one space before the number");
