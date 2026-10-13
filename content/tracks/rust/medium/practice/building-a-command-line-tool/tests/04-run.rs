// Fourteen lines: the tagged ones are 1, 4, 9, 10 and 14.
let text = "\
fix tap #home
call Bo #phone
pay rent
paint door #home
book train #travel
buy map #travel
renew pass
call Di #phone
mend fence #home
sweep yard #home
write Ana
buy film
sort photos
clean oven #home";

// Success: results on standard output, nothing on standard error, code 0.
let listed = run(&["tasks", "home"], text);
assert!(
    listed.stdout == "  1 fix tap #home\n  4 paint door #home\n  9 mend fence #home\n",
    "without a limit argument the first 3 tagged tasks are written, each number right-aligned in a width of 3"
);
assert!(listed.stderr.is_empty(), "a run that succeeds writes nothing to standard error");
assert!(listed.code == 0, "a run that succeeds ends with the exit code 0");

let all = run(&["tasks", "home", "9"], text);
assert!(
    all.stdout == "  1 fix tap #home\n  4 paint door #home\n  9 mend fence #home\n 10 sweep yard #home\n 14 clean oven #home\n",
    "a line number of two digits is right-aligned in the same width, and every line ends with a newline"
);
assert!(all.code == 0 && all.stderr.is_empty(), "a limit larger than the number of tagged tasks is still a success");

let one = run(&["tasks", "travel", "1"], text);
assert!(one.stdout == "  5 book train #travel\n", "the limit from the arguments is passed on to the search");

// A failed run: nothing on standard output, one line on standard error, code 1.
let missing = run(&["tasks", "garden", "2"], text);
assert!(missing.stdout.is_empty(), "when no task carries the tag, nothing is written to standard output");
assert!(
    missing.stderr == "error: no task is tagged #garden\n",
    "when no task carries the tag, standard error gets one line that names the tag"
);
assert!(missing.code == 1, "when no task carries the tag, the exit code is 1");

let empty = run(&["tasks", "home"], "");
assert!(
    empty.code == 1 && empty.stderr == "error: no task is tagged #home\n" && empty.stdout.is_empty(),
    "an empty file has no task with the tag, so the run fails in the same way"
);

// Wrong usage: nothing on standard output, two lines on standard error, code 2.
let no_tag = run(&["tasks"], text);
assert!(no_tag.stdout.is_empty(), "wrong usage writes nothing to standard output");
assert!(
    no_tag.stderr == "error: no tag given\nusage: tasks <tag> [limit]\n",
    "a missing tag gives the error line and then the usage line on standard error"
);
assert!(no_tag.code == 2, "wrong usage ends with the exit code 2");

let bad_limit = run(&["tasks", "home", "lots"], text);
assert!(
    bad_limit.stderr == "error: `lots` is not a limit\nusage: tasks <tag> [limit]\n",
    "a bad limit gives the message of Config::build after error: and then the usage line"
);
assert!(
    bad_limit.code == 2 && bad_limit.stdout.is_empty(),
    "a bad limit is wrong usage: exit code 2 and nothing on standard output, though the tag exists"
);

let zero = run(&["tasks", "home", "0"], text);
assert!(
    zero.code == 2 && zero.stderr == "error: `0` is not a limit\nusage: tasks <tag> [limit]\n",
    "a limit of 0 is wrong usage, not a search that finds nothing"
);
