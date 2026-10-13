// adjust_all
assert!(
    adjust_all(&[], |steps: u32| steps * 2).is_empty(),
    "no days give no results"
);
assert!(
    adjust_all(&[10, 20, 30, 5], |steps: u32| steps * 2) == [20, 40, 60, 10],
    "each day is adjusted, and the results keep the order of the days"
);

fn halve(steps: u32) -> u32 {
    steps / 2
}
assert!(adjust_all(&[9, 100], halve) == [4, 50], "a plain function can be passed where a closure is expected");

let days = vec![7000, 12000];
let cap = 10000;
let capped = adjust_all(&days, |steps: u32| if steps > cap { cap } else { steps });
assert!(capped == [7000, 10000], "a closure may read a variable of the scope it was written in");
assert!(days == [7000, 12000] && cap == 10000, "the days and the captured variable are left as they were");

// repeat
let mut calls = 0;
repeat(0, || calls += 1);
assert!(calls == 0, "asked for 0 calls, repeat never calls the action");

let mut calls = 0;
repeat(1, || calls += 1);
assert!(calls == 1, "asked for 1 call, repeat calls the action once");

let mut calls = 0;
repeat(25, || calls += 1);
assert!(calls == 25, "repeat calls the action exactly as often as it was asked to");

let mut log = Vec::new();
repeat(3, || log.push(log.len()));
assert!(log == [0, 1, 2], "every call sees what the calls before it changed");

// announce
assert!(
    announce(|| String::from("goal reached")) == ">> goal reached <<",
    "the message is framed by two arrows, each separated from it by one space"
);
assert!(announce(|| String::new()) == ">>  <<", "an empty message is still framed");

let mut asked = 0;
let text = announce(|| {
    asked += 1;
    String::from("lap")
});
assert!(text == ">> lap <<", "the framed text is the text the closure returned");
assert!(asked == 1, "announce calls its closure exactly once");

let owner = String::from("Grace");
let greeting = String::from("well done");
let text = announce(move || owner + ", " + &greeting);
assert!(text == ">> Grace, well done <<", "a closure that uses up a captured string can be passed to announce");
