import "testing/synctest"

// gameCaller makes the given calls one at a time on an unbuffered channel, closes it, and then
// closes finished.
func gameCaller(made []string) (calls <-chan string, finished <-chan struct{}) {
	out := make(chan string)
	done := make(chan struct{})
	go func() {
		defer close(done)
		for _, call := range made {
			out <- call
		}
		close(out)
	}()
	return out, done
}

// checkCaller fails the test unless the caller has made every call and finished.
func checkCaller(finished <-chan struct{}, what string) {
	synctest.Wait()
	select {
	case <-finished:
	default:
		check.Fail("markCard keeps reading the calls to the end of the game, " + what)
	}
}

func Test(t *testing.T) {
	game := []string{"G 50", "B 3", "O 70", "N 33", "I 22", "B 9"}
	cases := []struct {
		card []string
		want int
		what string
	}{
		{[]string{"N 33", "B 3", "O 70"}, 4, "for a card that is full in the middle of the game"},
		{[]string{"B 9", "G 50"}, 6, "for a card that is full on the last call"},
		{[]string{"G 50"}, 1, "for a card of one square that is full on the first call"},
		{[]string{"B 3", "N 44"}, 0, "for a card that is never full"},
		{[]string{"O 75"}, 0, "for a card none of whose squares is called"},
	}
	for _, c := range cases {
		synctest.Test(t, func(t *testing.T) {
			calls, finished := gameCaller(game)
			check.Equal(markCard(calls, c.card), c.want, "the call on which the card is full, "+c.what)
			checkCaller(finished, c.what)
		})
	}

	synctest.Test(t, func(t *testing.T) {
		calls, finished := gameCaller(nil)
		check.Equal(markCard(calls, []string{"B 1"}), 0, "markCard when the game has no calls")
		checkCaller(finished, "when the game has no calls")
	})
}
