---
title: Designing with Interfaces
summary: Use interfaces as the seams of a design, accepting small interfaces defined by the code that uses them and returning concrete types, inject dependencies through constructors, test with hand-written fakes, adapt functions with HandlerFunc-style types, configure with functional options, and know when an interface is one too many.
minutes: 35
objectives:
  - Apply "accept interfaces, return structs" and define an interface in the package that uses it
  - Inject a dependency through a constructor and replace it with a hand-written fake in a test
  - Write a function type that satisfies an interface, and functional options for a constructor
  - Recognise interface pollution and design functions around io.Reader-style interfaces
---

## Outline

1. Accept interfaces, return structs
2. Define the interface where it is used
3. Inject dependencies, fake them in tests
4. Function types as adapters
5. Functional options
6. When not to add an interface

## Accept interfaces, return structs

Medium lesson 03 stated the rule; this lesson builds a small design with it. A dental surgery
texts its patients the day before their appointments. Package `sms` talks to a text-message
gateway, and package `reminders` decides what to send.

```go
// sms/sms.go
// Gateway is a connection to the gateway. It has more methods than any one
// caller needs.
type Gateway struct {
	sender  string
	credits int
}

// Dial returns a concrete *Gateway, not an interface.
func Dial(sender string, credits int) *Gateway {
	return &Gateway{sender: sender, credits: credits}
}

// Send sends one text message.
func (g *Gateway) Send(to, text string) error {
	if g.credits == 0 {
		return fmt.Errorf("sms: no credits left for %s", to)
	}
	g.credits--
	fmt.Printf("[%s -> %s] %s\n", g.sender, to, text)
	return nil
}

func (g *Gateway) Credits() int { return g.credits }
func (g *Gateway) Close() error { return nil }
```

`Dial` **returns a struct**: callers get every method, documented in one place, and the package
can add methods later without breaking anyone. A function that returns an interface hides all
that behind a narrower view chosen in advance. Effective Go names the exception: a type that
exists only to implement a well-known interface, with no behaviour of its own, is returned as
that interface, as `crc32.NewIEEE()` returns a `hash.Hash32`.

Functions should **accept interfaces**: as little as they need, so that any type with those
methods will do. The standard library's `io.Reader` is the model:

```go
// countLines counts the lines of anything that can be read.
func countLines(r io.Reader) (int, error) {
	lines := 0
	scanner := bufio.NewScanner(r)
	for scanner.Scan() {
		lines++
	}
	return lines, scanner.Err()
}

func main() {
	fmt.Println(countLines(strings.NewReader("Ada 09:30\nBo 11:00\nCy 14:15\n")))
	var buf bytes.Buffer
	fmt.Fprintln(&buf, "one booking")
	fmt.Println(countLines(&buf))
	fmt.Println(countLines(io.LimitReader(strings.NewReader("a\nb\nc\n"), 3)))
}
```

```text
3 <nil>
1 <nil>
2 <nil>
```

The same function reads a string, a buffer, a limited stream, and also a file or a network
connection, none of which it knows about.

## Define the interface where it is used

`reminders` needs exactly one thing from a messaging service, so it says so, in its own package:

```go
// reminders/reminders.go
// Sender is all this package needs from a messaging service.
type Sender interface {
	Send(to, text string) error
}

// Service sends reminders through whatever Sender it is given.
type Service struct {
	sender    Sender
	signature string
}

// Remind texts every patient, and returns the errors of the texts that failed.
func (s *Service) Remind(appointments []Appointment) error {
	var errs []error
	for _, a := range appointments {
		text := fmt.Sprintf("Hello %s, see you tomorrow at %s. - %s", a.Patient, a.Time, s.signature)
		if err := s.sender.Send(a.Phone, text); err != nil {
			errs = append(errs, fmt.Errorf("reminding %s: %w", a.Patient, err))
		}
	}
	return errors.Join(errs...)
}
```

`*sms.Gateway` satisfies `reminders.Sender` without either package mentioning the other's types:
Go interfaces are satisfied implicitly. This is the **consumer side** rule from the Go Code Review
Comments: an interface belongs to the package that uses it. Had `sms` exported a
`Messenger` interface with all three methods, every fake would have to write all three:

```text
./main.go:22:9: cannot use &fakeSender{} (value of type *fakeSender) as Messenger value in argument to remind: *fakeSender does not implement Messenger (missing method Close)
```

Small interfaces are easy to satisfy and easy to fake. One method is common: `io.Reader`,
`io.Writer`, `fmt.Stringer`, `error`.

## Inject dependencies, fake them in tests

**Dependency injection** here just means the constructor takes the dependency as a parameter
instead of creating it: `reminders.New(sender Sender) *Service`. Production code passes the
gateway:

```go
gateway := sms.Dial("Dentist", 1)
defer gateway.Close()

service := reminders.New(gateway) // *sms.Gateway satisfies reminders.Sender
err := service.Remind([]reminders.Appointment{
	{Patient: "Ada", Phone: "07700 900001", Time: "09:30"},
	{Patient: "Bo", Phone: "07700 900002", Time: "11:00"},
})
fmt.Println("error:", err)
```

```text
[Dentist -> 07700 900001] Hello Ada, see you tomorrow at 09:30. - the surgery
error: reminding Bo: sms: no credits left for 07700 900002
```

A test passes a **fake** instead: a small type written for the test that records what happened
and fails on demand. No mocking library is needed:

```go
// fakeSender records every text instead of sending it, and fails for
// the numbers in fail.
type fakeSender struct {
	sent []string
	fail map[string]bool
}

func (f *fakeSender) Send(to, text string) error {
	if f.fail[to] {
		return errors.New("unreachable")
	}
	f.sent = append(f.sent, to+": "+text)
	return nil
}

func TestRemindReportsFailures(t *testing.T) {
	fake := &fakeSender{fail: map[string]bool{"2": true}}
	err := New(fake).Remind([]Appointment{{"Ada", "1", "09:30"}, {"Bo", "2", "11:00"}})

	if len(fake.sent) != 1 {
		t.Fatalf("sent %d texts, want 1: %q", len(fake.sent), fake.sent)
	}
	if err == nil || err.Error() != "reminding Bo: unreachable" {
		t.Errorf("err = %v", err)
	}
	t.Log(fake.sent[0])
}
```

```text
=== RUN   TestRemindReportsFailures
    reminders_test.go:33: 1: Hello Ada, see you tomorrow at 09:30. - the surgery
--- PASS: TestRemindReportsFailures (0.00s)
```

The test runs in microseconds, sends nothing, and checks the failure path, which the real
gateway would make hard to reach.

## Function types as adapters

Sometimes a whole type is too much: the caller just has a function. `net/http` solves this with
`http.HandlerFunc`, a function type with a method that calls the function, so any function of the
right shape becomes an `http.Handler`. The same three lines work for `Sender`:

```go
// SendFunc lets an ordinary function be a Sender, as http.HandlerFunc does
// for http.Handler.
type SendFunc func(to, text string) error

// Send calls f(to, text).
func (f SendFunc) Send(to, text string) error { return f(to, text) }
```

`reminders.SendFunc(func(to, text string) error { ... })` is now a `Sender`: handy for a dry run
that prints instead of texting, and for one-line fakes in tests.

## Functional options

A constructor with many optional settings becomes a wall of parameters, or of zero values.
**Functional options** keep the required arguments positional and make each optional setting a
function that changes the value being built:

```go
// Option changes a Service while New builds it.
type Option func(*Service)

// WithSignature signs every text with name instead of "the surgery".
func WithSignature(name string) Option {
	return func(s *Service) { s.signature = name }
}

// New returns a Service that sends with sender, changed by any options.
func New(sender Sender, opts ...Option) *Service {
	s := &Service{sender: sender, signature: "the surgery"}
	for _, opt := range opts {
		opt(s)
	}
	return s
}
```

With `printer` a `SendFunc` that prints, `reminders.New(printer, reminders.WithSignature("Dr
Shah")).Remind(...)` for one appointment gives:

```text
would text 07700 900003: Hello Cy, see you tomorrow at 14:15. - Dr Shah
```

Defaults live in one place, `New(gateway)` stays short, and adding `WithRetries(n)` or
`WithTimeout(d)` later breaks no caller.

## When not to add an interface

**Interface pollution** is adding interfaces nobody needs. Signs of it: an interface with
exactly one implementation and no test that fakes it; an interface defined next to its only
implementation "for mocking"; a constructor that hides a type with methods of its own behind an
interface; a `Manager` interface
that copies every method of a struct. Each adds a name to learn and a layer to jump through
when reading. Start with concrete types. Add an interface when a second implementation appears,
or when a test needs a fake, and define it where it is used, with only the methods used there.

## Common mistakes

- **Defining a big interface on the producer side.** Every fake must implement methods the code
  never calls: `does not implement Messenger (missing method Close)`. Declare a small one in the
  consumer.
- **Returning an interface from a constructor of a type with its own methods.** Callers lose
  the methods the interface leaves out. Return `*Service`.
- **Creating dependencies inside the code that uses them.** `sms.Dial` called inside `Remind`
  cannot be replaced in a test. Take it as a constructor parameter.
- **Passing a value when the methods have pointer receivers.** `New(fakeSender{})` fails with
  `fakeSender does not implement Sender (method Send has pointer receiver)`. Pass `&fakeSender{}`.

## Practice

1. Which of these could `countLines` read: `os.Stdin`, a `*bytes.Buffer`, a `string`?
2. Write an option `WithPrefix(p string) Option` that the service puts before every text.
3. Write a one-line fake with `SendFunc` that always fails with `errors.New("gateway down")`.

### Answers

1. `os.Stdin` (an `*os.File`) and a `*bytes.Buffer` both have `Read`; a `string` does not, so wrap
   it: `strings.NewReader(s)`.

```go
// 2. A new field, set by the option; Remind puts s.prefix before the text.
type Service struct {
	sender    Sender
	signature string
	prefix    string
}

func WithPrefix(p string) Option {
	return func(s *Service) { s.prefix = p }
}

// 3.
down := reminders.SendFunc(func(to, text string) error { return errors.New("gateway down") })
err := reminders.New(down).Remind([]reminders.Appointment{{Patient: "Di", Phone: "4", Time: "16:00"}})
fmt.Println(err)
```

```text
reminding Di: gateway down
```

## Key takeaways

- Accept the smallest interface a function needs; return concrete types.
- Define interfaces in the package that uses them; Go's implicit satisfaction makes that work.
- Inject dependencies through constructors and test with small hand-written fakes.
- A function type with a method (`http.HandlerFunc`, `SendFunc`) turns functions into interface
  values.
- Functional options keep constructors short and extensible; add interfaces only when they pay.

## Further reading

- [Go Code Review Comments: Interfaces](https://go.dev/wiki/CodeReviewComments#interfaces)
- [Effective Go: Interfaces and other types](https://go.dev/doc/effective_go#interfaces_and_types)
- [Package net/http: HandlerFunc](https://pkg.go.dev/net/http#HandlerFunc)
