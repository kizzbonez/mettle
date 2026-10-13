//! Bird Count
//!
//! Watchers in different hides send their reports over one channel, a tally
//! board is shared between threads, and a pile of cards behind a mutex is read
//! without keeping it locked.

use std::collections::HashMap;
use std::sync::Mutex;
use std::sync::mpsc::{self, Sender};
use std::thread;

/// Runs every watcher on a thread of its own and returns all the reports they send.
pub fn gather<F>(watchers: Vec<F>) -> Vec<String>
where
    F: FnOnce(Sender<String>) + Send + 'static,
{
    let (tx, rx) = mpsc::channel();
    let mut handles = Vec::new();
    for watcher in watchers {
        let tx = tx.clone();
        handles.push(thread::spawn(move || watcher(tx)));
    }
    // Only the watchers hold senders now. With the original still alive, the
    // channel would never close and the line below would wait forever.
    drop(tx);

    let reports: Vec<String> = rx.iter().collect();
    for handle in handles {
        handle.join().expect("a watcher panicked");
    }
    reports
}

/// The board in the visitor centre: how often each species has been seen.
pub struct TallyBoard {
    counts: Mutex<HashMap<String, u32>>,
}

impl TallyBoard {
    /// An empty board.
    pub fn new() -> TallyBoard {
        TallyBoard { counts: Mutex::new(HashMap::new()) }
    }

    /// Adds one sighting of `species`.
    pub fn record(&self, species: &str) {
        let mut counts = self.counts.lock().unwrap();
        *counts.entry(species.to_string()).or_insert(0) += 1;
    }

    /// The sightings of `species` so far.
    pub fn count(&self, species: &str) -> u32 {
        self.counts.lock().unwrap().get(species).copied().unwrap_or(0)
    }
}

/// Reads the cards on the pile, newest first, until none is left.
pub fn read_pile<F>(pile: &Mutex<Vec<String>>, mut read: F) -> usize
where
    F: FnMut(String),
{
    let mut cards_read = 0;
    loop {
        // The guard is a temporary, so the pile is unlocked again at the `;`.
        // In the condition of a `while let` it would stay locked for the
        // whole loop body, and so during `read`.
        let next = pile.lock().unwrap().pop();
        match next {
            Some(card) => {
                read(card);
                cards_read += 1;
            }
            None => break,
        }
    }
    cards_read
}
