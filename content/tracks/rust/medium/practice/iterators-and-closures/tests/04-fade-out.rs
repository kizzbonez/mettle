// Calling next by hand.
let mut fade = FadeOut::new(50, 20);
assert!(fade.next() == Some(50), "the first call returns the starting volume");
assert!(fade.next() == Some(30), "the second call returns the volume one step lower");
assert!(fade.next() == Some(10), "the third call returns the volume two steps lower");
assert!(fade.next() == None, "a step larger than what is left takes the volume to 0, which is not returned");
assert!(fade.next() == None, "after the end, next keeps returning None");
assert!(fade.next() == None, "after the end, next keeps returning None however often it is called");

// The step lands exactly on 0.
let levels: Vec<u32> = FadeOut::new(90, 30).collect();
assert!(levels == [90, 60, 30], "when the steps land exactly on 0, the 0 itself is not returned");

let levels: Vec<u32> = FadeOut::new(3, 1).collect();
assert!(levels == [3, 2, 1], "a fade-out in steps of 1 returns every level down to 1");

// One step is enough, or none is needed.
let levels: Vec<u32> = FadeOut::new(20, 50).collect();
assert!(levels == [20], "a step larger than the starting volume gives the starting volume alone");

let levels: Vec<u32> = FadeOut::new(20, 20).collect();
assert!(levels == [20], "a step equal to the starting volume gives the starting volume alone");

assert!(FadeOut::new(0, 10).next() == None, "a fade-out that starts at 0 has no levels");
assert!(FadeOut::new(0, 10).count() == 0, "a fade-out that starts at 0 counts 0 levels");

// Everything else comes with next.
assert!(FadeOut::new(100, 30).sum::<u32>() == 220, "the levels can be added up with sum");
assert!(FadeOut::new(100, 30).last() == Some(10), "the quietest level is the last one");
assert!(
    FadeOut::new(100, 30).take(2).collect::<Vec<u32>>() == [100, 70],
    "take stops the fade-out early"
);
let halved: Vec<u32> = FadeOut::new(80, 40).map(|level| level / 2).collect();
assert!(halved == [40, 20], "the levels can be passed through map");

// Two fade-outs are independent.
let mut loud = FadeOut::new(100, 50);
let mut quiet = FadeOut::new(9, 3);
assert!(
    loud.next() == Some(100) && quiet.next() == Some(9) && loud.next() == Some(50) && quiet.next() == Some(6),
    "two fade-outs each keep their own volume and step"
);
