//! Quiz Night
//!
//! Scores and team names for a quiz night. Every function borrows its data:
//! a `&` reference to read it, a `&mut` reference to change it.
//!
//! Every `todo!(...)` below marks code you still have to write. Until you
//! replace one, calling that function stops the test with "not yet implemented".

/// Adds points to a score that the caller lent out.
pub fn add_points(score: &mut u32, points: u32) {
    todo!("add_points")
}

/// Appends a team name to the roster. Names are separated by ", ".
pub fn sign_up(roster: &mut String, team: &str) {
    todo!("sign_up")
}

/// The width of a team's banner: the length of the name plus 4.
pub fn banner_width(team: &String) -> usize {
    todo!("banner_width")
}

/// A reference to the name of the team with more points. A tie goes to
/// `first`. The `'a` says that the result borrows from both names.
pub fn leader<'a>(
    first: &'a String,
    first_score: u32,
    second: &'a String,
    second_score: u32,
) -> &'a String {
    todo!("leader")
}
