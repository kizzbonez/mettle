package main

import (
	"sync"
	"sync/atomic"
)

// Register records which wristband belongs to whom. It is safe for use by many goroutines.
type Register struct {
	mu      sync.Mutex // guards the fields below
	holders map[int]string
	last    int
}

// newRegister returns an empty register, ready to use.
func newRegister() *Register {
	return &Register{holders: make(map[int]string)}
}

// Issue gives name the next wristband number, starting at 1, and returns it.
func (r *Register) Issue(name string) int {
	r.mu.Lock()
	defer r.mu.Unlock()
	// Reading last, adding one and storing it must happen as one step, or two desks
	// could hand out the same number.
	r.last++
	r.holders[r.last] = name
	return r.last
}

// Holder returns who holds an active wristband, or "" and false.
func (r *Register) Holder(band int) (string, bool) {
	r.mu.Lock()
	defer r.mu.Unlock()
	name, ok := r.holders[band]
	return name, ok
}

// Cancel cancels an active wristband and reports whether it was active.
func (r *Register) Cancel(band int) bool {
	r.mu.Lock()
	defer r.mu.Unlock()
	if _, ok := r.holders[band]; !ok {
		return false
	}
	delete(r.holders, band)
	return true
}

// Active returns how many wristbands are active.
func (r *Register) Active() int {
	r.mu.Lock()
	defer r.mu.Unlock()
	return len(r.holders)
}

// Gate counts the scans at the festival gates. The zero value is ready to use.
type Gate struct {
	scans atomic.Int64
}

// Scan counts one scan.
func (g *Gate) Scan() {
	g.scans.Add(1)
}

// Total returns how many scans there have been.
func (g *Gate) Total() int64 {
	return g.scans.Load()
}

// lazySiteMap returns a function that loads the site map on its first call and returns the
// same map on every call.
func lazySiteMap(load func() []string) func() []string {
	// OnceValue runs load at most once; callers that arrive while it runs wait for its result.
	return sync.OnceValue(load)
}
