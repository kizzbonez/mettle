/**
 * `check/run.go`: running the learner's code and watching what it does. `PrintedBy` returns
 * what a call printed, `RunScript` runs solution.go as a program, and `Recover`, which the
 * harness defers in every test, turns a panic into a plain reason.
 */
export const GO_CHECK_RUN = String.raw`package check

import (
	"bytes"
	"errors"
	"fmt"
	"io"
	"os"
	"os/exec"
	"regexp"
	"runtime"
	"runtime/debug"
	"strings"
)

// PrintedBy calls BODY and returns what it printed to standard output.
func PrintedBy(body func()) string {
	reader, writer, err := os.Pipe()
	if err != nil {
		Fail("the test could not capture the output: " + err.Error())
	}
	done := make(chan string)
	go func() {
		var printed bytes.Buffer
		io.Copy(&printed, reader)
		done <- printed.String()
	}()
	original := os.Stdout
	func() {
		defer func() {
			os.Stdout = original
			writer.Close()
		}()
		os.Stdout = writer
		body()
	}()
	return <-done
}

// Ran is what one run of the learner's program did.
type Ran struct {
	Out  string // what it printed to standard output
	Err  string // what it printed to standard error
	Code int    // its exit status
}

// RunScript runs solution.go as a program, as "go run . ARGS" would, typing STDIN into it.
func RunScript(stdin string, args ...string) Ran {
	if _, err := os.Stat("program"); err != nil {
		Fail("solution.go is not a program: it needs package main and a func main()")
	}
	command := exec.Command("./program", args...)
	command.Stdin = strings.NewReader(stdin)
	var out, errOut bytes.Buffer
	command.Stdout, command.Stderr = &out, &errOut
	ran := Ran{Code: 0}
	if err := command.Run(); err != nil {
		var exit *exec.ExitError
		if !errors.As(err, &exit) {
			Fail("the test could not start the program: " + err.Error())
		}
		ran.Code = exit.ExitCode()
	}
	ran.Out, ran.Err = out.String(), errOut.String()
	if strings.Contains(ran.Err, "WARNING: DATA RACE") {
		Fail("your program has a data race"+raceLine(ran.Err)+": two goroutines used the same memory at once, at least one writing", ran.Err)
	}
	return ran
}

var solutionLine = regexp.MustCompile(` + '`' + String.raw`/solution\.go:(\d+)` + '`' + String.raw`)

func raceLine(report string) string {
	if found := solutionLine.FindStringSubmatch(report); found != nil {
		return " (solution.go line " + found[1] + ")"
	}
	return ""
}

// Recover is deferred by the harness in every test: a panic fails the test with a plain reason.
func Recover() {
	value := recover()
	if value == nil {
		return
	}
	where := ""
	if name := panickedIn(); name != "" {
		where = " in " + name
	}
	Fail(fmt.Sprintf("unexpected panic%s: %v", where, value), string(debug.Stack()))
}

// panickedIn names the innermost function of solution.go on the panicking stack.
func panickedIn() string {
	pcs := make([]uintptr, 64)
	frames := runtime.CallersFrames(pcs[:runtime.Callers(0, pcs)])
	for {
		frame, more := frames.Next()
		if strings.HasSuffix(frame.File, "/solution.go") {
			return shortName(frame.Function)
		}
		if !more {
			return ""
		}
	}
}

var closure = regexp.MustCompile(` + '`' + String.raw`(\.(func|gowrap)?\d+)+$` + '`' + String.raw`)

// shortName turns "lab.(*Cart).Add.func1" into "Cart.Add".
func shortName(function string) string {
	name := function[strings.LastIndex(function, "/")+1:]
	if dot := strings.Index(name, "."); dot >= 0 {
		name = name[dot+1:]
	}
	name = strings.NewReplacer("(*", "", ")", "").Replace(name)
	return closure.ReplaceAllString(name, "")
}
`;
