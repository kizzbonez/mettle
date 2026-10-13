//! Task Filter
//!
//! The core of `tasks`, a command-line tool that prints the tasks with a
//! given tag. Nothing here reads the real command line or a file: the
//! arguments and the text come in as values, and what the program would
//! print comes back as a value, so every part can be tested.

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
        // `get` instead of indexing: a missing argument is no reason to panic.
        let tag = args.get(1).ok_or("no tag given")?.to_string();
        let limit = match args.get(2) {
            Some(text) => match text.parse::<usize>() {
                Ok(limit) if limit > 0 => limit,
                _ => return Err(format!("`{text}` is not a limit")),
            },
            None => 3,
        };
        Ok(Config { tag, limit })
    }
}

/// The first `limit` tasks that carry the tag, each with its line number.
pub fn tagged<'a>(text: &'a str, tag: &str, limit: usize) -> Vec<(usize, &'a str)> {
    let wanted = format!("#{tag}");
    text.lines()
        .enumerate()
        .filter(|(_, line)| line.split_whitespace().any(|word| word == wanted))
        .map(|(index, line)| (index + 1, line))
        .take(limit)
        .collect()
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
    let config = match Config::build(args) {
        Ok(config) => config,
        Err(message) => {
            return Outcome {
                stdout: String::new(),
                stderr: format!("error: {message}\nusage: tasks <tag> [limit]\n"),
                code: 2,
            };
        }
    };

    let tasks = tagged(text, &config.tag, config.limit);
    if tasks.is_empty() {
        return Outcome {
            stdout: String::new(),
            stderr: format!("error: no task is tagged #{}\n", config.tag),
            code: 1,
        };
    }

    let mut stdout = String::new();
    for (number, line) in tasks {
        stdout.push_str(&format!("{number:>3} {line}\n"));
    }
    Outcome { stdout, stderr: String::new(), code: 0 }
}
