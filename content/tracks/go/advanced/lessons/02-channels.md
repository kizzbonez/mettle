---
title: Channels
summary: Pass values between goroutines over unbuffered and buffered channels, close them from the sending side, receive with range and comma-ok, restrict directions in signatures, and recognise a deadlock.
minutes: 35
objectives:
  - Send and receive on unbuffered and buffered channels, and say when each operation blocks
  - Close a channel from the sending side and receive with range and the comma-ok form
  - Write a generator that returns a receive-only channel, with directions in its signature
  - Recognise a deadlock and the panics of misused channels, and signal an event with chan struct{}
---

## Outline

1. A channel is a meeting point
2. Deadlock
3. Buffered channels
4. Closing, comma-ok and range
5. Who closes a channel
6. Directions and generators
7. Signalling with chan struct{}
8. nil channels

## A channel is a meeting point

In lesson 01, goroutines handed back results through a shared slice. A **channel** is Go's other
way: a typed pipe that one goroutine sends values into and another receives them from. Effective
Go puts it as "Do not communicate by sharing memory; instead, share memory by communicating."
`make(chan T)` creates one, `ch <- v` sends and `<-ch` receives:

```go
func main() {
	orders := make(chan string)
	go func() {
		orders <- "flat white"
	}()
	order := <-orders
	fmt.Println("making a", order)
}
```

```text
making a flat white
```

This channel is **unbuffered**: it holds no values. A send waits until a receiver takes the value,
and a receive waits until a sender offers one, so the two goroutines meet, the value passes from
hand to hand and both carry on. The meeting also synchronizes them: whatever the sender did before
the send is visible to the receiver after the receive, so passing data this way is never a data
race. Here `main` waits for the order without a `WaitGroup`.

## Deadlock

A send with nobody to receive waits forever:

```go
func main() {
	orders := make(chan string)
	orders <- "flat white"
	fmt.Println(<-orders)
}
```

Run with plain `go run .`:

```text
fatal error: all goroutines are asleep - deadlock!

goroutine 1 [chan send]:
main.main()
	/work/main.go:7 +0x36
exit status 2
```

The runtime noticed that no goroutine could ever proceed. `[chan send]` says what goroutine 1 is
waiting for, and `main.go:7` where. It only notices when *every* goroutine is stuck; in a busy
program a stuck goroutine just waits forever, unnoticed (a **leak**, lesson 06). Under the race
detector this check does not fire at all: the same program hangs, and a lab test hangs until its
time limit, which prints where every goroutine is waiting.

## Buffered channels

`make(chan T, n)` gives a channel a **buffer** for `n` values. A send blocks only when the buffer
is full, and a receive only when it is empty. `len` counts the values waiting and `cap` is the
buffer's size:

```go
func main() {
	queue := make(chan string, 3)
	queue <- "flat white"
	queue <- "oat latte"
	fmt.Println(len(queue), cap(queue))
	fmt.Println(<-queue, "then", <-queue)
}
```

```text
2 3
flat white then oat latte
```

Values come out in the order they went in. A buffer lets the sender run ahead of the receiver by
up to `n` values; it does not make a wrong program right. Adding a buffer to "fix" a deadlock only
hides it until the buffer fills. Start with unbuffered channels; use a buffer when you know how
many values will be sent and want no sender to wait, or to absorb short bursts.

## Closing, comma-ok and range

`close(ch)` records that no more values will be sent. Values already buffered can still be
received; after them, every receive returns the zero value at once. The two-value form
`v, ok := <-ch` tells the cases apart: `ok` is false when the channel is closed and empty.
`for v := range ch` receives until exactly that happens:

```go
func main() {
	queue := make(chan string, 3)
	queue <- "flat white"
	queue <- "oat latte"
	close(queue)

	for order := range queue {
		fmt.Println("making", order)
	}
	order, ok := <-queue
	fmt.Printf("%q %v\n", order, ok)
}
```

```text
making flat white
making oat latte
"" false
```

Close a channel only when a receiver needs to know that the values have ended, as `range` does.
A channel nobody closes is collected by the garbage collector like any other value.

## Who closes a channel

**The sender closes**, because only the sender knows it has finished. A receiver that closes a
channel makes the next send panic:

```go
func main() {
	queue := make(chan string, 1)
	close(queue)
	queue <- "flat white"
}
```

```text
panic: send on closed channel

goroutine 1 [running]:
main.main()
	/work/main.go:6 +0x57
exit status 2
```

Closing twice panics with `close of closed channel`. When several goroutines send on one channel,
none of them can close it safely; something that waits for all of them closes it once (lesson 06
builds this).

## Directions and generators

A channel type can carry a **direction**: `chan<- T` can only send, `<-chan T` can only receive.
An ordinary channel converts to either automatically, so a signature can say who does what and
the compiler holds everyone to it. A **generator** is a function that starts a goroutine to
produce values and returns the receive-only end:

```go
// tickets returns a channel that delivers n ticket numbers, starting at first, and is then
// closed.
func tickets(first, n int) <-chan int {
	out := make(chan int)
	go func() {
		defer close(out)
		for i := range n {
			out <- first + i
		}
	}()
	return out
}

func main() {
	for ticket := range tickets(41, 3) {
		fmt.Println("now serving", ticket)
	}
}
```

```text
now serving 41
now serving 42
now serving 43
```

`defer close(out)` closes the channel however the goroutine ends. The caller cannot send or close:
`queue := tickets(41, 3)` followed by `queue <- 99` and `close(queue)` does not compile:

```text
./main.go:16:2: invalid operation: cannot send to receive-only channel <-chan int queue (variable of type <-chan int)
./main.go:17:8: invalid operation: cannot close receive-only channel queue (variable of type <-chan int)
```

## Signalling with chan struct{}

When the event matters and no value does, use `chan struct{}`. A `struct{}` takes no memory, and
the type tells the reader "this is a signal". Closing the channel signals every receiver at once,
because a receive on a closed channel always proceeds:

```go
func grind(done chan<- struct{}) {
	fmt.Println("grinding beans")
	close(done)
}

func main() {
	done := make(chan struct{})
	go grind(done)
	<-done
	fmt.Println("beans ready")
}
```

```text
grinding beans
beans ready
```

## nil channels

The zero value of a channel type is `nil`, and a nil channel is never ready: a send or receive on
it blocks forever, and `close` panics with `close of nil channel`. Receiving from
`var orders chan string` prints:

```text
fatal error: all goroutines are asleep - deadlock!

goroutine 1 [chan receive (nil chan)]:
```

A forgotten `make` is the usual cause. Lesson 03 turns this behaviour into a tool.

## Common mistakes

- **Ranging over a channel nobody closes.** The loop never ends. With nothing else running, plain
  `go run` stops with the deadlock error and `goroutine 1 [chan receive]:`. Close it in the sender.
- **Closing from the receiving side, or twice.** `send on closed channel` or `close of closed
  channel`. Only the one sender closes.
- **A buffer as a deadlock fix.** `make(chan T, 1)` delays the hang to the second send. Find who
  should be receiving.
- **Ignoring `ok`.** `for { v := <-ch ... }` on a closed channel spins on zero values forever. Use
  `range`, or check `ok`.

## Practice

1. Write a generator `squares(nums []int) <-chan int`.
2. A channel of capacity 2 receives `1` and `2` and is closed. What do three `v, ok := <-ch`
   receives print?
3. Start three barista goroutines that each print that they are ready, and make `main` wait for
   all of them using one `chan struct{}` and no `WaitGroup`.

### Answers

```go
// squares returns a channel that delivers the square of each number, then is closed.
func squares(nums []int) <-chan int {
	out := make(chan int)
	go func() {
		defer close(out)
		for _, n := range nums {
			out <- n * n
		}
	}()
	return out
}

func main() {
	for sq := range squares([]int{3, 4, 12}) {
		fmt.Println(sq)
	}

	ch := make(chan int, 2)
	ch <- 1
	ch <- 2
	close(ch)
	for range 3 {
		v, ok := <-ch
		fmt.Println(v, ok)
	}

	done := make(chan struct{})
	for barista := range 3 {
		go func() {
			fmt.Println("barista", barista, "ready")
			done <- struct{}{}
		}()
	}
	for range 3 {
		<-done
	}
	fmt.Println("café open")
}
```

```text
9
16
144
1 true
2 true
0 false
barista 0 ready
barista 2 ready
barista 1 ready
café open
```

The baristas may report in any order; `main` receives exactly three signals.

## Key takeaways

- An unbuffered channel is a meeting point: send and receive wait for each other.
- A buffered channel blocks only when full (send) or empty (receive).
- The sender closes; `range` and `v, ok := <-ch` see the close.
- `<-chan T` and `chan<- T` in signatures let the compiler enforce who sends.
- `chan struct{}` signals events; closing it signals every receiver.
- A nil channel blocks forever. Deadlock is detected only when every goroutine is stuck, and not
  under `-race`.

## Further reading

- [The Go Programming Language Specification: Channel types](https://go.dev/ref/spec#Channel_types)
- [Effective Go: Concurrency](https://go.dev/doc/effective_go#concurrency)
- [Go by Example: Channel Directions](https://gobyexample.com/channel-directions)
