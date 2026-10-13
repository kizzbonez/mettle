// The example from the instructions.
let text = "buy milk #shop\ncall Bo #phone\nbuy stamps #shop #post\nwater plants\nreturn shoes #shop";

assert_eq!(
    Config::build(&["tasks", "shop", "2"]),
    Ok(Config { tag: String::from("shop"), limit: 2 }),
    "the config built from the arguments tasks, shop and 2"
);

assert_eq!(
    tagged(text, "shop", 2),
    [(1, "buy milk #shop"), (3, "buy stamps #shop #post")],
    "the first two tasks tagged #shop, with their line numbers"
);

// A run that succeeds: results on standard output, exit code 0.
assert_eq!(
    run(&["tasks", "shop", "2"], text),
    Outcome {
        stdout: String::from("  1 buy milk #shop\n  3 buy stamps #shop #post\n"),
        stderr: String::new(),
        code: 0,
    },
    "the outcome of asking for two tasks tagged #shop"
);

// A run that fails: the message on standard error, exit code 1.
assert_eq!(
    run(&["tasks", "garden"], text),
    Outcome {
        stdout: String::new(),
        stderr: String::from("error: no task is tagged #garden\n"),
        code: 1,
    },
    "the outcome of asking for a tag that no task carries"
);

// Wrong usage: the message and the usage line on standard error, exit code 2.
assert_eq!(
    run(&["tasks"], text),
    Outcome {
        stdout: String::new(),
        stderr: String::from("error: no tag given\nusage: tasks <tag> [limit]\n"),
        code: 2,
    },
    "the outcome of running the program without a tag"
);
