use std::sync::Arc;
use std::thread;

// One thread first.
let board = TallyBoard::new();
assert!(board.count("heron") == 0, "a species nobody has recorded has a count of 0");
board.record("heron");
board.record("coot");
board.record("heron");
assert!(board.count("heron") == 2, "every sighting of a species adds one to its count");
assert!(board.count("coot") == 1, "each species has a count of its own");
assert!(board.count("Heron") == 0, "a count is kept for exactly the name that was recorded");

// `record` takes `&self`: a shared reference is enough to change the board.
let shared: &TallyBoard = &board;
shared.record("coot");
assert!(board.count("coot") == 2, "a sighting recorded through a shared reference is counted");

// Six spawned threads on one board.
let board = Arc::new(TallyBoard::new());
let watchers: Vec<_> = (0..6)
    .map(|watcher| {
        let board = Arc::clone(&board);
        thread::spawn(move || {
            for sighting in 0..300 {
                board.record(if sighting % 3 == 0 { "heron" } else { "coot" });
                if sighting % 60 == 0 {
                    thread::yield_now();
                }
            }
            board.record(&format!("rarity {watcher}"));
        })
    })
    .collect();
for watcher in watchers {
    assert!(watcher.join().is_ok(), "a thread records its sightings without a panic");
}
assert!(board.count("heron") == 600, "no sighting is lost when six threads record on one board");
assert!(board.count("coot") == 1200, "every thread's sightings of a second species are all counted");
for watcher in 0..6 {
    assert!(
        board.count(&format!("rarity {watcher}")) == 1,
        "a species seen once, by one thread only, has a count of 1"
    );
}
assert!(board.count("wren") == 0, "a species none of the threads recorded still has a count of 0");

// Scoped threads can borrow a board that lives on the stack.
let board = TallyBoard::new();
thread::scope(|s| {
    for _ in 0..4 {
        s.spawn(|| {
            for _ in 0..100 {
                board.record("swift");
            }
        });
    }
});
assert!(board.count("swift") == 400, "four scoped threads that borrow one board lose no sighting");
