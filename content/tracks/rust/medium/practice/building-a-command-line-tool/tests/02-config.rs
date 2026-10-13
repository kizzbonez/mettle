fn config(tag: &str, limit: usize) -> Result<Config, String> {
    Ok(Config { tag: tag.to_string(), limit })
}

// The tag, and the limit with its default.
assert!(Config::build(&["tasks", "shop"]) == config("shop", 3), "without a third argument the limit is 3");
assert!(Config::build(&["tasks", "shop", "1"]) == config("shop", 1), "1 is the smallest limit");
assert!(Config::build(&["tasks", "phone", "250"]) == config("phone", 250), "a limit of several digits");
assert!(
    Config::build(&["target/debug/tasks", "post", "4"]) == config("post", 4),
    "the first argument is the program name, whatever it looks like, and is skipped"
);
assert!(
    Config::build(&["shop", "garden"]) == config("garden", 3),
    "the first argument is never taken for the tag"
);
assert!(
    Config::build(&["tasks", "Shop-2"]) == config("Shop-2", 3),
    "the tag is stored exactly as it was typed"
);
assert!(
    Config::build(&["tasks", "shop", "2", "extra", "9"]) == config("shop", 2),
    "arguments after the limit are ignored"
);

// No tag.
assert!(
    Config::build(&["tasks"]) == Err(String::from("no tag given")),
    "the program name alone is not enough: the tag is missing"
);
assert!(
    Config::build(&[]) == Err(String::from("no tag given")),
    "no arguments at all is an error and not a panic"
);

// A limit that is not one.
assert!(
    Config::build(&["tasks", "shop", "many"]) == Err(String::from("`many` is not a limit")),
    "a word as the limit is refused, and the message shows it between backticks"
);
assert!(
    Config::build(&["tasks", "shop", "0"]) == Err(String::from("`0` is not a limit")),
    "a limit of 0 is refused"
);
assert!(
    Config::build(&["tasks", "shop", "-1"]) == Err(String::from("`-1` is not a limit")),
    "a negative limit is refused"
);
assert!(
    Config::build(&["tasks", "shop", "2.5"]) == Err(String::from("`2.5` is not a limit")),
    "a limit with a decimal point is refused"
);
assert!(
    Config::build(&["tasks", "shop", ""]) == Err(String::from("`` is not a limit")),
    "an empty limit is refused"
);
