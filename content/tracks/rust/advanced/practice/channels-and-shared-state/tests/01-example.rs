use std::sync::mpsc::{self, Sender};
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;

// 1. Two hides report over one channel.
let hides = vec![("north", vec!["heron", "coot"]), ("south", vec!["heron"])];
let watchers: Vec<_> = hides
    .into_iter()
    .map(|(hide, birds)| {
        move |reports: Sender<String>| {
            for bird in birds {
                reports.send(format!("{hide}: {bird}")).unwrap();
            }
        }
    })
    .collect();

// `gather` waits until its channel is closed. If yours never closes, that wait
// has no end, so the test runs `gather` on a helper thread and gives up after
// three seconds instead of hanging.
let (done, wait) = mpsc::channel();
thread::spawn(move || done.send(gather(watchers)));
let Ok(mut reports) = wait.recv_timeout(Duration::from_secs(3)) else {
    panic!("gather returns the reports once every watcher has finished");
};
reports.sort(); // the order of arrival is up to the scheduler
assert_eq!(
    reports,
    ["north: coot", "north: heron", "south: heron"],
    "the three reports of the two hides, sorted"
);

// 2. One board, two threads.
let board = Arc::new(TallyBoard::new());
let in_the_hide = Arc::clone(&board);
thread::spawn(move || in_the_hide.record("heron")).join().unwrap();
board.record("heron");
board.record("coot");
assert_eq!(board.count("heron"), 2, "the herons recorded by two threads on one board");
assert_eq!(board.count("wren"), 0, "the count of a species nobody has recorded");

// 3. The pile on the desk.
let pile = Mutex::new(vec![String::from("coot at dawn"), String::from("two herons")]);
let mut seen = Vec::new();
assert_eq!(read_pile(&pile, |card| seen.push(card)), 2, "the number of cards read from a pile of two");
assert_eq!(seen, ["two herons", "coot at dawn"], "the cards in the order they were read");
