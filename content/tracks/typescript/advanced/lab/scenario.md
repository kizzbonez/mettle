The Lantern Street Playhouse is a 180-seat theatre run by a small crew. During a performance the
stage manager sits at a desk in the wings and "calls the show": a standby warns the operators
that a cue is coming, and a go fires it. Three desks follow the calls. The lighting desk fades
the lamps, the sound desk plays effects, and the fly desk raises and lowers scenery on ropes.

```text
standby  { cue: 12 }
cueGo    { cue: 12, desk: "lights" }
cueGo    { cue: 12, desk: "sound" }
showStop { reason: "fire alarm" }
```

The playhouse is replacing its old show-control script. That script passed events around as
plain strings and objects, so a typo such as `"cuego"`, or a cue number sent as text, was only
found mid-performance. One desk's crash stopped the others from hearing the call. Its "wait for
the next cue" feature could not be cancelled, so after an emergency stop the stage stayed
blocked, waiting for a go that would never come.

You are writing the core of the new system: a typed event bus. The events of a show are
described once as a TypeScript type. From it, the compiler works out which events exist, which
payload each one carries, and what the desks' handler objects look like, so mistakes are caught
before the curtain goes up. At run time the bus calls listeners in a predictable order, keeps
going when one desk fails, and lets a desk wait for the next cue with a wait the stage manager
can cancel at once.
