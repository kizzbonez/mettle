Complete `solution.go`. Every type and function here is used by many goroutines at once, and the
tests run under the race detector: a data race fails a test even when every value is right.

1. **`Register`** records which wristband belongs to whom. Give the struct the fields it needs: a
   `sync.Mutex` that guards the other fields, a map from wristband number to holder, and the
   last number issued. Write **`newRegister() *Register`** and these methods, each of which
   locks the mutex (with `defer` to unlock) for the whole time it uses the fields:
   - **`Issue(name string) int`** gives `name` the next wristband number and returns it. Numbers
     start at 1 and go up by one with every wristband issued; a number is never issued twice,
     even after it is cancelled.
   - **`Holder(band int) (string, bool)`** returns who holds the wristband and `true`, or `""`
     and `false` for a number that is not active (never issued, or cancelled).
   - **`Cancel(band int) bool`** cancels an active wristband and returns `true`, or returns
     `false` if the number is not active.
   - **`Active() int`** returns how many wristbands are active.
2. **`Gate`** counts the scans at the festival gates. Give it one field of type `atomic.Int64`
   (from `sync/atomic`), so that the zero value `var g Gate` is ready to use, and write
   **`Scan()`**, which counts one scan, and **`Total() int64`**, which returns the count so far.
   Use no mutex here.
3. **`lazySiteMap(load func() []string) func() []string`** returns a function that gives the site
   map. The first call of the returned function calls `load` and returns its result; every later
   call returns the same result without calling `load` again. `lazySiteMap` itself must not call
   `load`, and when many goroutines make the first call at the same moment, `load` still runs
   exactly once and they all get its result. `sync.OnceValue` does exactly this.

Keep the pointer receivers. A method with a value receiver works on a copy of the struct, mutex
included, so its lock protects nothing: `go vet` reports `Active passes lock by value`, and the
race detector catches the race it causes.

Example:

```go
r := newRegister()
r.Issue("Ada")  // 1
r.Issue("Bo")   // 2
r.Holder(2)     // "Bo", true
r.Cancel(1)     // true
r.Cancel(1)     // false: already cancelled
r.Holder(1)     // "", false
r.Issue("Cy")   // 3: number 1 is not reused
r.Active()      // 2

var g Gate
g.Scan()
g.Scan()
g.Total() // 2

siteMap := lazySiteMap(loadFromServer) // loadFromServer is not called yet
siteMap() // calls loadFromServer and returns its map
siteMap() // the same map, without calling loadFromServer
```
