//! Pedal Board
//!
//! Effect pedals as plain functions in a lookup table, a function that never
//! returns, and pedals with a dial, which are closures behind a `Box<dyn Fn>`.

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
    // Every `fn(i32) -> i32` has the same type, so they fit in one array.
    let table: [(&str, fn(i32) -> i32); 4] =
        [("boost", boost), ("double", double), ("invert", invert), ("mute", mute)];
    for (known, effect) in table {
        if known == name {
            return Some(effect);
        }
    }
    None
}

/// Stops the show. This function never returns.
pub fn blow_fuse(name: &str) -> ! {
    panic!("no pedal called {name}");
}

/// Sends a level through the named pedals, from first to last.
pub fn play(names: &[&str], level: i32) -> i32 {
    let mut level = level;
    for name in names {
        let effect = match pedal(name) {
            Some(effect) => effect,
            // `blow_fuse` has the type `!`, which fits any type, so the
            // `match` as a whole is still a `fn(i32) -> i32`.
            None => blow_fuse(name),
        };
        level = effect(level);
    }
    level
}

/// Builds a pedal with a dial that is set to `amount`.
pub fn dial(kind: &str, amount: i32) -> Box<dyn Fn(i32) -> i32> {
    // Four closures are four types, so the function returns a trait object.
    // `move` lets each closure keep `amount` after this call has ended.
    match kind {
        "gain" => Box::new(move |level| level + amount),
        "clip" => Box::new(move |level| level.min(amount)),
        "gate" => Box::new(move |level| if level < amount { 0 } else { level }),
        _ => Box::new(|level| level),
    }
}
