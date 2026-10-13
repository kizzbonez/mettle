Write two functions and one small type with the standard library only. The signatures are in
the starter. The private fields of `TallyBoard` are yours to choose.

1. `gather(watchers: Vec<F>) -> Vec<String>`, where
   `F: FnOnce(Sender<String>) + Send + 'static`, collects the reports of every watcher.
   - Create one channel. Run each watcher on a thread of its own and hand it its own `Sender`.
   - Start every watcher before you wait for anything, so that they all work at the same time.
   - Return the reports in the order they arrive. Reports of different watchers may mix
     differently on every run, but the reports of one watcher always keep their order.
   - Return only when every watcher's `Sender` is gone, which is when no report can follow.
     With no watchers at all the result is an empty `Vec`.
2. `TallyBoard` counts sightings for each species. The tests share one board between threads,
   so a `RefCell` or a `Cell` inside it will not compile.
   - `TallyBoard::new() -> TallyBoard` is an empty board.
   - `record(&self, species: &str)` adds one sighting of that species.
   - `count(&self, species: &str) -> u32` is the number of sightings recorded for exactly that
     name, and `0` for a species nobody has recorded.
3. `read_pile(pile: &Mutex<Vec<String>>, read: F) -> usize`, where `F: FnMut(String)`, works
   through the cards on the desk.
   - Take one card at a time from the **end** of the pile, until the pile is empty.
   - Call `read(card)` for each card **while the pile is unlocked**. Reading takes a while, and
     volunteers must be able to put new cards on the pile in the meantime.
   - A card that is put on the pile during the reading is read as well.
   - Return the number of cards that were read.

Example:

```rust
// 1. Two hides report over one channel.
let hides = vec![("north", vec!["heron", "coot"]), ("south", vec!["heron"])];
let watchers: Vec<_> = hides
    .into_iter()
    .map(|(hide, birds)| {
        move |reports: Sender<String>| {
            for bird in birds {
                reports.send(format!("{hide}: {bird}")).unwrap();
            }
        }
    })
    .collect();
let mut reports = gather(watchers);
reports.sort();                                // the order of arrival is up to the scheduler
reports                                        // ["north: coot", "north: heron", "south: heron"]

// 2. One board, two threads.
let board = Arc::new(TallyBoard::new());
let in_the_hide = Arc::clone(&board);
thread::spawn(move || in_the_hide.record("heron")).join().unwrap();
board.record("heron");
board.record("coot");
board.count("heron")                           // 2
board.count("wren")                            // 0

// 3. The pile on the desk.
let pile = Mutex::new(vec![String::from("coot at dawn"), String::from("two herons")]);
let mut seen = Vec::new();
read_pile(&pile, |card| seen.push(card))       // 2
seen                                           // ["two herons", "coot at dawn"]
```

**Tip:** a lock guard that is created in the condition of a `while let` lives until the end of
the loop body. A guard created in a `let` statement and not stored is gone at the `;`.
