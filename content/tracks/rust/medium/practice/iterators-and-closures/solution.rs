//! Playlist
//!
//! Three questions about a playlist, each answered by one iterator pipeline,
//! and an iterator of your own that steps a volume down to nothing.

use std::num::ParseIntError;

/// One track of a playlist.
#[derive(Debug, Clone, PartialEq)]
pub struct Track {
    pub title: String,
    pub seconds: u32,
}

impl Track {
    /// Builds a track.
    pub fn new(title: &str, seconds: u32) -> Track {
        Track { title: title.to_string(), seconds }
    }
}

/// The playing time of all the tracks together.
pub fn total_seconds(tracks: &[Track]) -> u32 {
    tracks.iter().map(|track| track.seconds).sum()
}

/// The titles of the tracks longer than `limit` seconds, in playlist order.
pub fn long_titles(tracks: &[Track], limit: u32) -> Vec<String> {
    tracks
        .iter()
        .filter(|track| track.seconds > limit)
        .map(|track| track.title.clone())
        .collect()
}

/// Every text as a number, or the error of the first text that is not one.
pub fn parse_lengths(texts: &[&str]) -> Result<Vec<u32>, ParseIntError> {
    // An iterator of `Result` values collects into a `Result` of the collection.
    texts.iter().map(|text| text.parse::<u32>()).collect()
}

/// The volume levels of a fade-out, from the starting volume down.
pub struct FadeOut {
    volume: u32,
    step: u32,
}

impl FadeOut {
    /// A fade-out that starts at `volume` and drops by `step` each time.
    pub fn new(volume: u32, step: u32) -> FadeOut {
        FadeOut { volume, step }
    }
}

impl Iterator for FadeOut {
    type Item = u32;

    fn next(&mut self) -> Option<u32> {
        if self.volume == 0 {
            return None;
        }
        let current = self.volume;
        if self.volume > self.step {
            self.volume -= self.step;
        } else {
            self.volume = 0;
        }
        Some(current)
    }
}
