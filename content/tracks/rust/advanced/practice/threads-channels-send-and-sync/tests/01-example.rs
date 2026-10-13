use std::thread;

// The example from the instructions.
let ballots: Vec<String> = ["ada", "lin", "ada", "sam", "ada"].iter().map(|name| name.to_string()).collect();

let for_ada = count_for(ballots.clone(), "ada");
let for_lin = count_for(ballots.clone(), "lin");
// A counter whose thread panics. `resume_unwind` panics without printing a
// message, which keeps this test's output short.
let dropped = thread::spawn(|| -> usize { std::panic::resume_unwind(Box::new("the pile fell on the floor")) });

assert_eq!(
    collect_counts(vec![for_ada, dropped, for_lin]),
    [Some(3), None, Some(1)],
    "the counts for ada, for a thread that panicked, and for lin, in that order"
);

// `on_the_list` is a local variable. The closure only borrows it, which a
// scoped thread is allowed to do.
let on_the_list = ["ada", "lin"];
assert_eq!(
    count_valid(&ballots, |ballot| on_the_list.contains(&ballot)),
    4,
    "the ballots that name ada or lin among ada, lin, ada, sam and ada"
);
