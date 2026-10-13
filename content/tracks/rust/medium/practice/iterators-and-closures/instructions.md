`Track`, with its public fields `title` and `seconds`, and `Track::new` are complete in the
starter. Write the three functions, each as one iterator pipeline with no `for` loop, and then
the `next` method of `FadeOut`.

1. `total_seconds(tracks: &[Track]) -> u32` is the playing time of all the tracks together.
   An empty playlist has `0` seconds.
2. `long_titles(tracks: &[Track], limit: u32) -> Vec<String>` is the titles of the tracks that
   are longer than `limit` seconds, in playlist order. A track of exactly `limit` seconds is
   not long.
3. `parse_lengths(texts: &[&str]) -> Result<Vec<u32>, ParseIntError>` parses every text as a
   `u32`, as it is and without trimming. If all of them parse, it returns the numbers in
   order. Otherwise it returns the error of the first text that does not parse. `collect` can
   build exactly this `Result`.
4. `FadeOut` is an iterator over the volume levels of a fade-out. Its constructor,
   `FadeOut::new(volume, step)`, is given. Implement `next`: each call returns the current
   volume and then lowers it by `step`. The volume never goes below `0`: a step larger than
   what is left takes it to `0`. A volume of `0` is not returned. Once it is reached, `next`
   returns `None`, however often it is called. The tests never use a step of `0`.

Example:

```rust
let tracks = [
    Track::new("Intro", 45),
    Track::new("Harbour Lights", 215),
    Track::new("Slow Train", 372),
];
total_seconds(&tracks)                        // 632
long_titles(&tracks, 200)                     // ["Harbour Lights", "Slow Train"]

parse_lengths(&["45", "215"])                 // Ok([45, 215])
parse_lengths(&["45", "three"])               // Err(..), the error of "three"

let levels: Vec<u32> = FadeOut::new(100, 30).collect();      // [100, 70, 40, 10]
FadeOut::new(100, 30).filter(|level| *level >= 40).count()   // 3
```

The last line works without any more code: an iterator gets every adapter and consumer from
its `next`.
