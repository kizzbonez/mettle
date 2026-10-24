Write the three functions in `solution.go`, adding the imports you need (`sync` for a
`WaitGroup`). Weights are whole kilograms and juice is whole litres.

1. **`crates(ctx context.Context, weights []int) <-chan int`** is the **source** of the pipeline.
   It returns a channel and starts one goroutine that sends every weight that is greater than 0,
   in the order given (a weight of 0 or less is an empty crate: skip it), and then closes the
   channel. Put each send in a `select` with `<-ctx.Done()`: once the context is done, stop
   sending and close the channel.
2. **`merge(ctx context.Context, belts ...<-chan int) <-chan int`** is the **fan-in**. Start one
   goroutine per belt that copies every value it receives onto a single output channel, each send
   in a `select` with `<-ctx.Done()`. Close the output exactly once, when every copier has
   finished: after all the belts are closed, or after the copiers stopped because the context is
   done. With no belts at all, the output is closed straight away.
3. **`pressAll(ctx context.Context, weights []int, presses int, press func(ctx context.Context, kg int) (int, error)) ([]int, error)`**
   is a **worker pool** that presses every weight and returns the litres.
   - Start `presses` worker goroutines (at least 1, and never more than there are weights) that
     take crate indexes from a jobs channel, so that `press` never runs more than `presses` times
     at once. Call `press` once per weight.
   - Element `i` of the result is what `press` returned for `weights[i]`, whatever order the
     presses finish in.
   - Give `press` a context made from `ctx` that you can cancel (`context.WithCancelCause` works
     well). At the **first error**, cancel it so the presses still running stop, start no more
     presses, and return `nil` and that first error, not the error of a press you stopped.
   - If `ctx` itself is cancelled, return `nil` and an error.
   - Return only after every goroutine you started has finished. With no weights, return an
     empty slice and `nil` without calling `press`.

The tests run your functions on a fake clock inside `synctest.Test` (lesson 07 shows how), so a
press that takes ten seconds takes no real time. They also fail if a goroutine you started is
still blocked when your function is done with it: the message then says
`deadlock: main bubble goroutine has exited but blocked goroutines remain`.

Example:

```go
ctx := context.Background()
for kg := range crates(ctx, []int{120, 0, 80, -5, 60}) {
	fmt.Println(kg) // 120, then 80, then 60, and the loop ends
}

a := crates(ctx, []int{10, 20})
b := crates(ctx, []int{30})
for kg := range merge(ctx, a, b) {
	fmt.Println(kg) // 10, 20 and 30, in some order, and the loop ends
}

juice := func(ctx context.Context, kg int) (int, error) {
	return kg * 6 / 10, nil // 0.6 litres per kilogram
}
pressAll(ctx, []int{120, 80, 60}, 2, juice) // [72 48 36] <nil>

errJammed := errors.New("press jammed")
jammed := func(ctx context.Context, kg int) (int, error) {
	if kg == 80 {
		return 0, errJammed
	}
	return juice(ctx, kg)
}
pressAll(ctx, []int{120, 80, 60}, 2, jammed) // [] press jammed
```
