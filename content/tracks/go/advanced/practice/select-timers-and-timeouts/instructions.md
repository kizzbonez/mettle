Write the three functions in `solution.go`. Each one needs a `select` statement. A log entry or a
call is the channel's name, a colon, a space and the message: `"coastguard: gale warning"`,
`"harbour: ferry leaving berth 3"`.

1. **`firstCall(coastguard, harbour <-chan string, limit time.Duration) (string, error)`** waits
   for the first message on **either** channel and returns it as a call, with a nil error. If no
   message arrives within `limit`, it returns `""` and the error `ErrQuiet` (declared in the
   starter) as soon as the limit is up. Use `time.After` for the limit. The tests never close
   these two channels.
2. **`watchLog(coastguard, harbour <-chan string) []string`** receives from both channels until
   **both** have been closed, and returns every message as a log entry, in the order the messages
   arrived. Check every receive with `v, ok := <-ch`; when a channel is closed, set your variable
   for it to `nil`, so that its `case` can no longer be chosen. With both channels closed from the
   start, return an empty slice.
3. **`broadcast(lines []string, every time.Duration, quit <-chan struct{}, send func(line
   string)) int`** reads the bulletin out at the pace of a `time.Ticker` with period `every`: call
   `send` with the first line on the first tick (one period after the start), with the next line
   on the next tick, and so on. Stop when every line has been sent, or as soon as `quit` is
   closed, whichever comes first, and return how many lines were sent. Stop the ticker before you
   return (`defer ticker.Stop()`). With no lines at all, return 0 at once without waiting. `quit`
   may be `nil`, which simply never closes. Call `send` from `broadcast` itself, never from
   another goroutine.

The tests run on a fake clock, so they can check exactly when each function returns and when
each line is sent: an hour of radio watch takes no real time. Do not use `time.Sleep`.

Example (`start` is the time each function was called):

```go
// The harbour office calls 2 seconds after start; the coastguard is silent.
firstCall(coastguard, harbour, 10*time.Second) // "harbour: ferry leaving berth 3", nil, after 2 s
firstCall(coastguard, harbour, 5*time.Second)  // "", ErrQuiet, after 5 s, when nothing is sent

// The coastguard sends "gale warning" at 1 s and closes at 3 s;
// the harbour sends "dredger at the bar" at 2 s and closes straight after.
watchLog(coastguard, harbour) // ["coastguard: gale warning" "harbour: dredger at the bar"], at 3 s

broadcast([]string{"wind NW 5", "sea moderate", "visibility good"}, time.Minute, nil, send)
// send("wind NW 5") at 1 min, send("sea moderate") at 2 min, send("visibility good") at 3 min;
// returns 3 at 3 min
```
