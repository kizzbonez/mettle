//! Pedal Board
//!
//! Effect pedals as plain functions in a lookup table, a function that never
//! returns, and pedals with a dial, which are closures behind a `Box<dyn Fn>`.
//!
//! Every `todo!(...)` below marks code you still have to write. Until you
//! replace one, calling that function stops the test with "not yet implemented".

/// Given: adds 10 to the level.
pub fn boost(level: i32) -> i32 {
    level + 10
}

/// Given: doubles the level.
pub fn double(level: i32) -> i32 {
    level * 2
}

/// Given: turns the level upside down.
pub fn invert(level: i32) -> i32 {
    -level
}

/// Given: silence, whatever comes in.
pub fn mute(_level: i32) -> i32 {
    0
}

/// Looks a pedal up by its name.
pub fn pedal(name: &str) -> Option<fn(i32) -> i32> {
    // TODO 1: a table of names and `fn` pointers
    todo!("pedal")
}

/// Stops the show. This function never returns.
pub fn blow_fuse(name: &str) -> ! {
    todo!("blow_fuse")
}

/// Sends a level through the named pedals, from first to last.
pub fn play(names: &[&str], level: i32) -> i32 {
    // TODO 3: look each name up with `pedal`. For an unknown name, call `blow_fuse`.
    todo!("play")
}

/// Builds a pedal with a dial that is set to `amount`.
pub fn dial(kind: &str, amount: i32) -> Box<dyn Fn(i32) -> i32> {
    // TODO 4: return a different closure for each kind
    todo!("dial")
}
