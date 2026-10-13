//! Bird Count
//!
//! Watchers in different hides send their reports over one channel, a tally
//! board is shared between threads, and a pile of cards behind a mutex is read
//! without keeping it locked.
//!
//! Every `todo!(...)` below marks code you still have to write. Until you
//! replace one, calling that function stops the test with "not yet implemented".

use std::collections::HashMap;
use std::sync::Mutex;
use std::sync::mpsc::{self, Sender};
use std::thread;

/// Runs every watcher on a thread of its own and returns all the reports they send.
pub fn gather<F>(watchers: Vec<F>) -> Vec<String>
where
    F: FnOnce(Sender<String>) + Send + 'static,
{
    // TODO 1: one channel, one thread and one `Sender` for each watcher.
    //         Receiving stops only when every `Sender` is gone.
    todo!("gather")
}

/// The board in the visitor centre: how often each species has been seen.
pub struct TallyBoard {
    // TODO 2: choose what the board stores. Several threads will call
    //         `record` on the same board through `&self`.
}

impl TallyBoard {
    /// An empty board.
    pub fn new() -> TallyBoard {
        todo!("TallyBoard::new")
    }

    /// Adds one sighting of `species`.
    pub fn record(&self, species: &str) {
        todo!("TallyBoard::record")
    }

    /// The sightings of `species` so far.
    pub fn count(&self, species: &str) -> u32 {
        todo!("TallyBoard::count")
    }
}

/// Reads the cards on the pile, newest first, until none is left.
pub fn read_pile<F>(pile: &Mutex<Vec<String>>, mut read: F) -> usize
where
    F: FnMut(String),
{
    // TODO 3: take one card, let go of the lock, then call `read(card)`
    todo!("read_pile")
}
