Write the five functions. The first three take a closure, and the starter leaves the bound of
`F` out. Give each one the least demanding of `Fn`, `FnMut` and `FnOnce` that lets its body do
the job, together with the closure's parameter and return types. The first test passes closures
that build only with the right choice.

1. `adjust_all<F>(steps: &[u32], adjust: F) -> Vec<u32>` calls `adjust` with each day's step
   count, in order, and returns the results. `adjust` takes a `u32` and returns a `u32`.
2. `repeat<F>(times: u32, action: F)` calls `action` exactly `times` times. `action` takes
   nothing and returns nothing, and it may change a variable it has captured.
3. `announce<F>(message: F) -> String` calls `message` exactly once and returns its text with
   `>> ` in front and ` <<` behind. `message` takes nothing, returns a `String`, and may give
   away a value it has captured.
4. `goal_checker(goal: u32) -> impl Fn(u32) -> bool` returns a closure. Given a day's steps,
   the closure says whether they reach the goal: `true` for `goal` steps or more.
5. `streak_counter(goal: u32) -> impl FnMut(u32) -> u32` returns a closure that keeps a count
   of its own. Each call takes one day's steps and returns the streak so far: the number of
   days in a row, this one included, that reached the goal. A day below the goal sets the
   streak back to `0`. Every closure that `streak_counter` returns has a separate count.

The closures in 4 and 5 outlive the call that made them, so they must own what they capture.

Example:

```rust
let bonus = 500;
adjust_all(&[4000, 9500], |steps: u32| steps + bonus)    // [4500, 10000]

let mut buzzes = 0;
repeat(3, || buzzes += 1);                               // buzzes is now 3

let name = String::from("Ada");
announce(move || name)                                   // ">> Ada <<"

let reached = goal_checker(8000);
reached(9500)                                            // true
reached(4000)                                            // false

let mut streak = streak_counter(8000);
streak(9000)                                             // 1
streak(8000)                                             // 2
streak(100)                                              // 0
streak(8500)                                             // 1
```
