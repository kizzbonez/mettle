package main

// Register records which wristband belongs to whom. It is safe for use by many goroutines.
type Register struct {
	// Task 1: add a sync.Mutex, a map from wristband number to holder, and the last number
	// issued. Add the imports you need at the top of the file.
}

// newRegister returns an empty register, ready to use.
func newRegister() *Register {
	panic("not implemented")
}

// Issue gives name the next wristband number, starting at 1, and returns it.
func (r *Register) Issue(name string) int {
	panic("not implemented")
}

// Holder returns who holds an active wristband, or "" and false.
func (r *Register) Holder(band int) (string, bool) {
	panic("not implemented")
}

// Cancel cancels an active wristband and reports whether it was active.
func (r *Register) Cancel(band int) bool {
	panic("not implemented")
}

// Active returns how many wristbands are active.
func (r *Register) Active() int {
	panic("not implemented")
}

// Gate counts the scans at the festival gates. The zero value is ready to use.
type Gate struct {
	// Task 2: add one field of type atomic.Int64.
}

// Scan counts one scan.
func (g *Gate) Scan() {
	panic("not implemented")
}

// Total returns how many scans there have been.
func (g *Gate) Total() int64 {
	panic("not implemented")
}

// lazySiteMap returns a function that loads the site map on its first call and returns the
// same map on every call.
func lazySiteMap(load func() []string) func() []string {
	panic("not implemented")
}
