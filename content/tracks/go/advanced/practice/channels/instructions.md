Write the three functions in `solution.go`. Balls are numbered 1 to 75, and each one belongs to a
column of the card: **B** for 1 to 15, **I** for 16 to 30, **N** for 31 to 45, **G** for 46 to 60
and **O** for 61 to 75. A **call** is the letter, a space and the number: `"B 7"`, `"N 42"`.

1. **`loadDrum(balls []int) <-chan int`** loads the evening's balls into the drum: make a
   **buffered** channel whose capacity is exactly the number of balls, send every ball into it in
   order, close it, and return it. The buffer holds every ball, so this needs no goroutine. With
   no balls, return a closed channel of capacity 0.
2. **`announce(balls <-chan int) <-chan string`** starts the caller and **returns at once**. Make
   an **unbuffered** `chan string`, start one goroutine that receives every ball until `balls` is
   closed and sends its call on that channel, and return the channel. The goroutine is the only
   sender, so it closes the channel after the last call.
3. **`markCard(calls <-chan string, card []string) int`** plays one card. `card` holds the calls
   the player needs, at least one, all different, such as `[]string{"N 42", "B 7"}`. Receive the
   calls with `for range` and return the number of the call on which the last square of the card
   was called (the first call is number 1), or 0 if the game ended before the card was full. Keep
   receiving until `calls` is closed, even after the card is full: nobody leaves before the caller
   has finished, so the caller is never left waiting to make a call no one will hear.

The functions are tested separately as well as together, with channels the tests make
themselves, and every test runs under the race detector.

Example:

```go
drum := loadDrum([]int{7, 42, 75, 16})
len(drum), cap(drum) // 4, 4

for call := range announce(drum) {
	fmt.Println(call) // B 7, then N 42, then O 75, then I 16
}

calls := announce(loadDrum([]int{7, 42, 75, 16}))
markCard(calls, []string{"N 42", "B 7"}) // 2: B 7 and N 42 are both called by the second call
```
