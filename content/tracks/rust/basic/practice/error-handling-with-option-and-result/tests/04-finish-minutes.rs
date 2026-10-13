// Times that are valid.
assert!(finish_minutes("0:00") == Some(0), "zero hours and zero minutes");
assert!(finish_minutes("0:59") == Some(59), "59 is the largest minutes part that is allowed");
assert!(finish_minutes("2:05") == Some(125), "a minutes part with a leading zero");
assert!(finish_minutes("12:30") == Some(750), "hours of two digits");
assert!(finish_minutes("4:7") == Some(247), "a minutes part of one digit still parses as a number");

// No colon.
assert!(finish_minutes("") == None, "an empty text has no colon");
assert!(finish_minutes("225") == None, "a plain number has no colon");
assert!(finish_minutes("3.45") == None, "a dot is not a colon");

// A part that is not a number.
assert!(finish_minutes("3:") == None, "an empty minutes part is not a number");
assert!(finish_minutes(":45") == None, "an empty hours part is not a number");
assert!(finish_minutes("three:45") == None, "hours written as a word are not a number");
assert!(finish_minutes("3:4x") == None, "a minutes part with a letter in it is not a number");
assert!(finish_minutes("-3:45") == None, "negative hours do not parse as a u32");
assert!(
    finish_minutes("1:02:03") == None,
    "the text is split at the first colon only, so what follows it is not a number"
);

// Minutes out of range.
assert!(finish_minutes("3:60") == None, "60 minutes would be another hour, so it is rejected");
assert!(finish_minutes("3:99") == None, "a minutes part above 60 is rejected");
