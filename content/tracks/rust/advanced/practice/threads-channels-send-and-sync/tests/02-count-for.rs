use std::thread;

fn names(list: &[&str]) -> Vec<String> {
    list.iter().map(|name| name.to_string()).collect()
}

let ballots = names(&["ada", "lin", "ada", "sam", "ada", "adam", "Ada", "", "ada lovelace"]);

assert!(
    count_for(ballots.clone(), "ada").join().ok() == Some(3),
    "only the ballots that are exactly the candidate's name are counted"
);
assert!(
    count_for(ballots.clone(), "zed").join().ok() == Some(0),
    "a candidate nobody voted for has a count of 0"
);
assert!(count_for(Vec::new(), "ada").join().ok() == Some(0), "an empty ballot box gives a count of 0");

// The caller's name is gone before the thread is joined.
let handle = {
    let name = String::from("lin");
    count_for(ballots.clone(), &name)
};
assert!(
    handle.join().ok() == Some(1),
    "the thread counts with a copy of the candidate's name that it owns"
);

let handle = count_for(ballots.clone(), "sam");
assert!(
    handle.thread().id() != thread::current().id(),
    "the handle that count_for returns belongs to a new thread"
);
assert!(handle.join().ok() == Some(1), "the new thread returns the count");

// Four counts are started before any of them is joined.
let handles: Vec<_> = ["ada", "lin", "sam", "zed"].iter().map(|name| count_for(ballots.clone(), name)).collect();
let counts: Vec<Option<usize>> = handles.into_iter().map(|handle| handle.join().ok()).collect();
assert!(
    counts == [Some(3), Some(1), Some(1), Some(0)],
    "four counts that run at the same time each count their own candidate"
);
