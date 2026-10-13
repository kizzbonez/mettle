`Lifecycle` holds the state of one process: its `Phase`, a gauge `in_flight` (requests that
have begun and not ended), and three counters. The struct, `new`, `phase` and `in_flight` are
written. Write the five methods below. The tests play the part of the service: they call the
methods in the order in which requests and signals arrive.

1. `begin(&mut self) -> bool`: a request arrives.
   - While the phase is `Running`, it may start: add 1 to `accepted` and to `in_flight`, and
     return `true`.
   - In any other phase it is refused: add 1 to `rejected` and return `false`.
2. `end(&mut self)`: a request that was started has finished.
   - If nothing is in flight, do nothing.
   - Otherwise subtract 1 from `in_flight`. If the phase is `Draining` and that was the last
     request, the phase becomes `Stopped`.
3. `shutdown(&mut self)`: the request to stop has arrived. Only a `Running` process reacts.
   It becomes `Draining` if requests are in flight, and `Stopped` at once if none are.
4. `deadline(&mut self) -> u32`: the time allowed for draining is over. Only a `Draining`
   process reacts: the requests still in flight are given up. Add their number to
   `abandoned`, set `in_flight` to 0, set the phase to `Stopped`, and return that number. In
   any other phase return 0 and change nothing.
5. `status_line(&self) -> String` reports the state as one structured event, six
   `key=value` fields separated by single spaces:

   ```text
   level=info phase=running in_flight=1 accepted=2 rejected=0 abandoned=0
   ```

   `level` is `warn` once any request has been abandoned, and `info` before that. `phase` is
   `running`, `draining` or `stopped`.

Rule 2 has a reason: a request that was abandoned at the deadline may still report its end a
moment later. By then nothing is in flight, and that late `end` must neither panic nor change
a number.

Example:

```rust
let mut service = Lifecycle::new();
service.begin()          // true
service.begin()          // true
service.end();
service.status_line()    // "level=info phase=running in_flight=1 accepted=2 rejected=0 abandoned=0"

service.shutdown();      // one request is still in flight
service.phase()          // Phase::Draining
service.begin()          // false: intake has stopped
service.end();           // the last request finishes
service.phase()          // Phase::Stopped
service.status_line()    // "level=info phase=stopped in_flight=0 accepted=2 rejected=1 abandoned=0"

let mut slow = Lifecycle::new();
slow.begin();
slow.begin();
slow.begin();
slow.shutdown();
slow.deadline()          // 3: nobody finished in time
slow.status_line()       // "level=warn phase=stopped in_flight=0 accepted=3 rejected=0 abandoned=3"
```
