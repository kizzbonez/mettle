use std::sync::Mutex;

fn cards(texts: &[&str]) -> Vec<String> {
    texts.iter().map(|text| text.to_string()).collect()
}

// An empty pile.
let pile = Mutex::new(Vec::new());
let mut calls = 0;
assert!(read_pile(&pile, |_card| calls += 1) == 0, "an empty pile gives a count of 0");
assert!(calls == 0, "nothing is read from an empty pile");

// Newest first.
let pile = Mutex::new(cards(&["wren", "robin", "heron", "coot"]));
let mut seen = Vec::new();
let count = read_pile(&pile, |card| seen.push(card));
assert!(seen == ["coot", "heron", "robin", "wren"], "the cards are taken from the end of the pile, one at a time");
assert!(count == 4, "the result is the number of cards that were read");
assert!(pile.lock().unwrap().is_empty(), "the pile is empty when read_pile returns");

// While a card is being read, a volunteer walks up to the desk. `try_lock`
// fails if the pile is still locked at that moment.
let pile = Mutex::new(cards(&["wren", "robin", "heron"]));
let mut seen = Vec::new();
let mut found_locked = 0;
let count = read_pile(&pile, |card| {
    match pile.try_lock() {
        Ok(mut desk) => {
            if card == "robin" {
                desk.push(String::from("late owl"));
                desk.push(String::from("late swift"));
            }
        }
        Err(_) => found_locked += 1,
    }
    seen.push(card);
});
assert!(found_locked == 0, "the pile is unlocked while a card is being read");
assert!(
    seen == ["heron", "robin", "late swift", "late owl", "wren"],
    "cards that are put on the pile during the reading are read as well, newest first"
);
assert!(count == 5, "cards that arrived during the reading are counted too");

// A card that arrives while the last one is being read.
let pile = Mutex::new(cards(&["only"]));
let mut seen = Vec::new();
let count = read_pile(&pile, |card| {
    if card == "only" {
        if let Ok(mut desk) = pile.try_lock() {
            desk.push(String::from("one more"));
        }
    }
    seen.push(card);
});
assert!(
    seen == ["only", "one more"] && count == 2,
    "the reading goes on until the pile is found empty, not for as many cards as there were at the start"
);
assert!(pile.try_lock().is_ok(), "no lock on the pile is left behind");
