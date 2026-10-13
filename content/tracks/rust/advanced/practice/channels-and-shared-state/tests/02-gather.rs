use std::collections::HashSet;
use std::sync::mpsc::{self, RecvTimeoutError, Sender};
use std::sync::{Arc, Barrier, Mutex};
use std::thread::{self, ThreadId};
use std::time::Duration;

// `gather` waits on a channel, and a wrong version can wait forever. So it
// runs on a helper thread, and the test gives up after three seconds.
fn gather_or_fail<F>(watchers: Vec<F>, checking: &str) -> Vec<String>
where
    F: FnOnce(Sender<String>) + Send + 'static,
{
    let (done, wait) = mpsc::channel();
    thread::spawn(move || done.send(gather(watchers)));
    match wait.recv_timeout(Duration::from_secs(3)) {
        Ok(reports) => reports,
        Err(RecvTimeoutError::Timeout) => {
            eprintln!("gather did not return: {checking}");
            std::process::exit(1);
        }
        Err(RecvTimeoutError::Disconnected) => {
            eprintln!("gather panicked: {checking}");
            std::process::exit(1);
        }
    }
}

// No watchers: nothing can ever be sent, so there is nothing to wait for.
let nobody: Vec<fn(Sender<String>)> = Vec::new();
let reports = gather_or_fail(nobody, "with no watchers the channel is closed at once and the result is empty");
assert!(reports.is_empty(), "with no watchers there are no reports");

// Five watchers, forty numbered reports each, and a record of their threads.
let threads: Arc<Mutex<Vec<ThreadId>>> = Arc::new(Mutex::new(Vec::new()));
let watchers: Vec<_> = (0..5)
    .map(|hide| {
        let threads = Arc::clone(&threads);
        move |reports: Sender<String>| {
            threads.lock().unwrap().push(thread::current().id());
            for number in 0..40 {
                reports.send(format!("hide {hide} report {number}")).unwrap();
                if number % 8 == 0 {
                    thread::yield_now();
                }
            }
        }
    })
    .collect();
let reports = gather_or_fail(watchers, "receiving stops when the last watcher has dropped its Sender");

assert!(reports.len() == 200, "every report of every watcher is returned, and none twice");
let unique: HashSet<&String> = reports.iter().collect();
assert!(unique.len() == 200, "every report of every watcher is returned exactly once");
for hide in 0..5 {
    let prefix = format!("hide {hide} report ");
    let numbers: Vec<usize> = reports
        .iter()
        .filter_map(|report| report.strip_prefix(prefix.as_str()))
        .map(|number| number.parse().expect("the test's reports end in a number"))
        .collect();
    assert!(
        numbers == (0..40).collect::<Vec<usize>>(),
        "the reports come back in the order they arrived, so the reports of one watcher keep their order"
    );
}
let threads = threads.lock().unwrap();
let distinct: HashSet<&ThreadId> = threads.iter().collect();
assert!(distinct.len() == 5, "each watcher runs on a thread of its own");
assert!(
    !threads.contains(&thread::current().id()),
    "no watcher runs on the thread that asked for the reports"
);
drop(threads);

// Four watchers that wait for each other before they report. They can only
// get going if all four are running at the same time.
let meeting = Arc::new(Barrier::new(4));
let watchers: Vec<_> = (0..4)
    .map(|hide| {
        let meeting = Arc::clone(&meeting);
        move |reports: Sender<String>| {
            meeting.wait();
            reports.send(format!("hide {hide} is ready")).unwrap();
        }
    })
    .collect();
let reports = gather_or_fail(watchers, "every watcher is started before gather waits for any of them");
assert!(reports.len() == 4, "four watchers that start together send one report each");

// A watcher that has nothing to report, and one that hands a clone of its
// Sender to a helper of its own.
let quiet = |reports: Sender<String>| drop(reports);
let reports = gather_or_fail(vec![quiet], "a watcher that sends nothing still ends, and so does gather");
assert!(reports.is_empty(), "a watcher that sends nothing adds no report");

let with_helper = |reports: Sender<String>| {
    let helper = reports.clone();
    reports.send(String::from("first")).unwrap();
    thread::spawn(move || helper.send(String::from("from the helper")).unwrap()).join().unwrap();
};
let reports = gather_or_fail(vec![with_helper], "gather waits until every clone of a Sender is gone");
assert!(
    reports == ["first", "from the helper"],
    "a report sent through a clone of the watcher's Sender arrives like any other"
);
