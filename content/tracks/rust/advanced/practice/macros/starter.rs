//! Sports Day
//!
//! Three `macro_rules!` macros for the scorers' table: one takes any number
//! of arguments, one reads `name => points` pairs, and one declares a
//! variable that the caller names.
//!
//! `#[macro_export]` is what lets code outside this file, such as the tests,
//! call each macro by its plain name. Keep it above every macro.
//!
//! Each macro below has one placeholder rule. It accepts whatever it is given,
//! so that this file compiles, and expands to a `todo!`. Replace the whole
//! rule with rules of your own.
//!
//! Every `todo!(...)` below marks code you still have to write. Until you
//! replace one, calling that function stops the test with "not yet implemented".

/// The average of any number of times. With no arguments it is `0.0`.
#[macro_export]
macro_rules! average {
    // TODO 1: replace this placeholder rule.
    ($($anything:tt)*) => {{
        todo!("average!");
        0.0
    }};
}

/// A `HashMap<String, u32>` built from `name => points` pairs.
#[macro_export]
macro_rules! scoreboard {
    // TODO 2: replace this placeholder rule. Keep naming the map by its full
    //         path: a type in an expansion is looked up where the macro is called.
    ($($anything:tt)*) => {{
        todo!("scoreboard!");
        std::collections::HashMap::<String, u32>::new()
    }};
}

/// Declares a variable with the name the caller gives, holding the sum of the points.
#[macro_export]
macro_rules! tally {
    // TODO 3: replace this placeholder rule.
    ($name:ident $($anything:tt)*) => {
        let $name: u32 = todo!("tally!");
    };
}
