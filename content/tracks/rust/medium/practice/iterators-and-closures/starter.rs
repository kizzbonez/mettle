//! Playlist
//!
//! Three questions about a playlist, each answered by one iterator pipeline,
//! and an iterator of your own that steps a volume down to nothing.
//!
//! Every `todo!(...)` below marks code you still have to write. Until you
//! replace one, calling that function stops the test with "not yet implemented".

use std::num::ParseIntError;

/// One track of a playlist.
#[derive(Debug, Clone, PartialEq)]
pub struct Track {
    pub title: String,
    pub seconds: u32,
}

impl Track {
    /// Builds a track. Complete: nothing to write here.
    pub fn new(title: &str, seconds: u32) -> Track {
        Track { title: title.to_string(), seconds }
    }
}

/// The playing time of all the tracks together.
pub fn total_seconds(tracks: &[Track]) -> u32 {
    todo!("total_seconds")
}

/// The titles of the tracks longer than `limit` seconds, in playlist order.
pub fn long_titles(tracks: &[Track], limit: u32) -> Vec<String> {
    todo!("long_titles")
}

/// Every text as a number, or the error of the first text that is not one.
pub fn parse_lengths(texts: &[&str]) -> Result<Vec<u32>, ParseIntError> {
    todo!("parse_lengths")
}

/// The volume levels of a fade-out, from the starting volume down.
pub struct FadeOut {
    volume: u32,
    step: u32,
}

impl FadeOut {
    /// A fade-out that starts at `volume` and drops by `step` each time.
    /// Complete: nothing to write here.
    pub fn new(volume: u32, step: u32) -> FadeOut {
        FadeOut { volume, step }
    }
}

impl Iterator for FadeOut {
    type Item = u32;

    fn next(&mut self) -> Option<u32> {
        todo!("FadeOut::next")
    }
}
