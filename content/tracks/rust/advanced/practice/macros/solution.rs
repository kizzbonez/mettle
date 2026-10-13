//! Sports Day
//!
//! Three `macro_rules!` macros for the scorers' table: one takes any number
//! of arguments, one reads `name => points` pairs, and one declares a
//! variable that the caller names.
//!
//! `#[macro_export]` is what lets code outside this file, such as the tests,
//! call each macro by its plain name.

/// The average of any number of times. With no arguments it is `0.0`.
#[macro_export]
macro_rules! average {
    () => {
        0.0
    };
    ($($time:expr),+ $(,)?) => {{
        let mut sum = 0.0;
        let mut count = 0.0;
        // Each `$time` appears once in the expansion, so it runs once.
        $(
            sum += $time;
            count += 1.0;
        )+
        sum / count
    }};
}

/// A `HashMap<String, u32>` built from `name => points` pairs.
#[macro_export]
macro_rules! scoreboard {
    ($($name:expr => $points:expr),* $(,)?) => {{
        // Types in an expansion are looked up where the macro is called, so
        // the map is named by its full path.
        let mut board = std::collections::HashMap::<String, u32>::new();
        $(
            *board.entry($name.to_string()).or_insert(0) += $points;
        )*
        board
    }};
}

/// Declares a variable with the name the caller gives, holding the sum of the points.
#[macro_export]
macro_rules! tally {
    ($name:ident = $first:expr $(, $rest:expr)* $(,)?) => {
        // Hygiene would hide a name invented here. `$name` comes from the
        // caller, so the caller can see the variable.
        let $name = $first $(+ $rest)*;
    };
}
