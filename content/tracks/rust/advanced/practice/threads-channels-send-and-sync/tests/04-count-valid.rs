use std::collections::HashSet;
use std::sync::Mutex;
use std::thread::{self, ThreadId};

// Runs count_valid on numbered ballots and reports the count together with a
// record of which thread checked which ballot. The closure borrows local
// variables, so only scoped threads can run it.
fn observe(size: usize) -> (usize, Vec<(usize, ThreadId)>) {
    let ballots: Vec<String> = (0..size).map(|number| format!("ballot {number}")).collect();
    let spoiled = [String::from("ballot 3"), String::from("ballot 10"), String::from("ballot 11")];
    let checked: Mutex<Vec<(usize, ThreadId)>> = Mutex::new(Vec::new());

    let valid = count_valid(&ballots, |ballot| {
        let number: usize = ballot["ballot ".len()..].parse().expect("the test's ballots are numbered");
        checked.lock().unwrap().push((number, thread::current().id()));
        !spoiled.iter().any(|bad| bad == ballot)
    });

    let mut checked = checked.into_inner().unwrap();
    checked.sort_by_key(|(number, _)| *number);
    (valid, checked)
}

let me = thread::current().id();

// Twelve ballots: the halves are ballots 0 to 5 and ballots 6 to 11.
let (valid, checked) = observe(12);
assert!(valid == 9, "the valid ballots of both halves are added together");
assert!(checked.len() == 12, "is_valid is called exactly once for each ballot");
assert!(
    checked.iter().enumerate().all(|(index, (number, _))| index == *number),
    "every ballot is checked, and none is checked twice"
);
assert!(
    checked.iter().all(|(_, thread)| *thread != me),
    "nothing is counted on the thread that called count_valid"
);
let first_half: HashSet<ThreadId> = checked[..6].iter().map(|(_, thread)| *thread).collect();
let second_half: HashSet<ThreadId> = checked[6..].iter().map(|(_, thread)| *thread).collect();
assert!(first_half.len() == 1, "the first half of the ballots is counted by one thread");
assert!(second_half.len() == 1, "the second half of the ballots is counted by one thread");
assert!(first_half != second_half, "each half has a thread of its own");

// An odd number: split_at(7 / 2) gives 3 ballots and 4 ballots.
let (valid, checked) = observe(7);
assert!(valid == 6, "seven ballots with one spoiled one among them");
assert!(checked.len() == 7, "with an odd number of ballots, each one is still checked exactly once");
let first_half: HashSet<ThreadId> = checked[..3].iter().map(|(_, thread)| *thread).collect();
let second_half: HashSet<ThreadId> = checked[3..].iter().map(|(_, thread)| *thread).collect();
assert!(
    first_half.len() == 1 && second_half.len() == 1 && first_half != second_half,
    "the slice is split at len / 2: the first three of seven ballots go to one thread, the other four to the second"
);

// The smallest piles.
let (valid, checked) = observe(1);
assert!(valid == 1 && checked.len() == 1, "a single ballot is checked once");
assert!(checked[0].1 != me, "a single ballot is still not checked on the calling thread");
let (valid, checked) = observe(0);
assert!(valid == 0 && checked.is_empty(), "no ballots give a count of 0 and no call of is_valid");
