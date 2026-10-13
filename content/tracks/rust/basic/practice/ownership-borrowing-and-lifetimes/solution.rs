//! Quiz Night
//!
//! Scores and team names for a quiz night. Every function borrows its data:
//! a `&` reference to read it, a `&mut` reference to change it.

/// Adds points to a score that the caller lent out.
pub fn add_points(score: &mut u32, points: u32) {
    *score += points;
}

/// Appends a team name to the roster. Names are separated by ", ".
pub fn sign_up(roster: &mut String, team: &str) {
    if roster.len() > 0 {
        roster.push_str(", ");
    }
    roster.push_str(team);
}

/// The width of a team's banner: the length of the name plus 4.
pub fn banner_width(team: &String) -> usize {
    team.len() + 4
}

/// A reference to the name of the team with more points. A tie goes to
/// `first`. The `'a` says that the result borrows from both names.
pub fn leader<'a>(
    first: &'a String,
    first_score: u32,
    second: &'a String,
    second_score: u32,
) -> &'a String {
    if second_score > first_score {
        second
    } else {
        first
    }
}
