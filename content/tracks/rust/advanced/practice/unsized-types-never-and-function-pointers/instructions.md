The four stomp boxes `boost`, `double`, `invert` and `mute` are finished functions in the
starter. Each takes a signal level and returns the new one. Write the four functions below and
keep their signatures as they are.

1. `pedal(name: &str) -> Option<fn(i32) -> i32>` looks a stomp box up by name. The names
   `"boost"`, `"double"`, `"invert"` and `"mute"` give the function of that name as a `fn`
   pointer. Any other text gives `None`. The name must match exactly.
2. `blow_fuse(name: &str) -> !` never returns. It panics with the message
   `no pedal called NAME`, where `NAME` is the name it was given.
3. `play(names: &[&str], level: i32) -> i32` sends `level` through the named pedals in the
   order of the slice: the result of one pedal is the input of the next. It finds each pedal
   with `pedal` and calls `blow_fuse(name)` for a name that `pedal` does not know. With no
   names the level comes back unchanged.
4. `dial(kind: &str, amount: i32) -> Box<dyn Fn(i32) -> i32>` builds a pedal with a dial. The
   closure it returns still works after `dial` has returned.
   - `"gain"`: adds `amount` to the level.
   - `"clip"`: lets the level through, but never more than `amount`.
   - `"gate"`: lets a level of `amount` or more through unchanged and turns a lower one
     into `0`.
   - any other kind: lets the level through unchanged.

Example:

```rust
pedal("boost").map(|effect| effect(5))     // Some(15)
pedal("wah").is_none()                     // true

play(&["boost", "double"], 1)              // 22: boosted to 11, then doubled
play(&["boost", "wah"], 1)                 // panics with: no pedal called wah

let clip = dial("clip", 50);
clip(80)                                   // 50
clip(30)                                   // 30
dial("gain", -4)(10)                       // 6
dial("gate", 10)(9)                        // 0
dial("tremolo", 7)(42)                     // 42
```

**Tip:** in `play`, a `match` on the result of `pedal` can have `blow_fuse(name)` as its `None`
arm. A function that returns `!` fits where any type is expected.
