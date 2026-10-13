//! Task Filter
//!
//! The core of `tasks`, a command-line tool that prints the tasks with a
//! given tag. Nothing here reads the real command line or a file: the
//! arguments and the text come in as values, and what the program would
//! print comes back as a value, so every part can be tested.
//!
//! Every `todo!(...)` below marks code you still have to write. Until you
//! replace one, calling that function stops the test with "not yet implemented".

/// What the user asked for, checked.
#[derive(Debug, PartialEq)]
pub struct Config {
    /// The tag to look for, without the `#`.
    pub tag: String,
    /// The largest number of tasks to print.
    pub limit: usize,
}

impl Config {
    /// Turns the raw arguments into a `Config`. `args[0]` is the program name.
    pub fn build(args: &[&str]) -> Result<Config, String> {
        todo!("Config::build")
    }
}

/// The first `limit` tasks that carry the tag, each with its line number.
pub fn tagged<'a>(text: &'a str, tag: &str, limit: usize) -> Vec<(usize, &'a str)> {
    todo!("tagged")
}

/// Everything a run of the program does that the outside world can see.
#[derive(Debug, PartialEq)]
pub struct Outcome {
    /// What `println!` would have written: the results.
    pub stdout: String,
    /// What `eprintln!` would have written: the error messages.
    pub stderr: String,
    /// The exit code: 0 for success, 1 for a failed run, 2 for wrong usage.
    pub code: u8,
}

/// The whole program: arguments and the text of the file in, outcome out.
pub fn run(args: &[&str], text: &str) -> Outcome {
    todo!("run")
}
