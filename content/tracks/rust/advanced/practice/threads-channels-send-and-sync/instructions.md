Write the three functions with `std::thread` only. The signatures are in the starter and must
stay as they are: they decide which kind of thread each function can use.

1. `count_for(ballots: Vec<String>, candidate: &str) -> JoinHandle<usize>` starts a new thread
   and returns its handle without waiting for it. The thread counts the ballots that are
   exactly `candidate` and returns that number. The caller's `candidate` may be gone before the
   thread has finished, so the thread needs a copy of its own.
2. `collect_counts(handles: Vec<JoinHandle<usize>>) -> Vec<Option<usize>>` waits for every
   thread. It returns one entry for each handle, in the order of the handles: `Some(count)` for
   a thread that returned a count, and `None` for a thread that panicked. `collect_counts`
   itself never panics.
3. `count_valid(ballots: &[String], is_valid: F) -> usize`, where `F: Fn(&str) -> bool + Sync`,
   counts the ballots that `is_valid` accepts. The `Sync` bound is what allows two threads to
   share a reference to the closure.
   - Split the slice in the middle with `ballots.split_at(ballots.len() / 2)`.
   - Count each half on a **scoped** thread of its own. Nothing is counted on the calling
     thread.
   - Call `is_valid` exactly once for each ballot.

Example:

```rust
let ballots: Vec<String> = ["ada", "lin", "ada", "sam", "ada"].iter().map(|name| name.to_string()).collect();

let for_ada = count_for(ballots.clone(), "ada");
let for_lin = count_for(ballots.clone(), "lin");
let dropped = thread::spawn(|| -> usize { panic!("the pile fell on the floor") });
collect_counts(vec![for_ada, dropped, for_lin])       // [Some(3), None, Some(1)]

let on_the_list = ["ada", "lin"];                      // a local variable the closure borrows
count_valid(&ballots, |ballot| on_the_list.contains(&ballot))   // 4
```

**Tip:** if the compiler says a closure "may outlive the current function", read the note
under the error. It tells you whether the thread has to own the value or is allowed to borrow
it.
