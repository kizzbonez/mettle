import "strconv"

func Test(t *testing.T) {
	var q Queue[string]
	check.Equal(q.Len(), 0, "Len of a new queue")
	check.Equal(q.Map(func(s string) int { return len(s) }), []int{}, "Map on an empty queue")
	for _, car := range []string{"van", "estate", "hatchback"} {
		q.Push(car)
	}
	check.Equal(q.Map(func(s string) int { return len(s) }), []int{3, 6, 9}, "Map to a different type, front first")
	check.Equal(q.Len(), 3, "Map leaves every value in the queue")

	var popped []string
	for {
		v, ok := q.Pop()
		if !ok {
			break
		}
		popped = append(popped, v)
	}
	check.Equal(popped, []string{"van", "estate", "hatchback"}, "values come out in the order they were pushed")
	v, ok := q.Pop()
	check.Equal(v, "", "the value Pop returns from an emptied Queue[string]")
	check.True(!ok, "Pop on an emptied queue reports false")

	q.Push("coupe")
	check.Equal(q.Len(), 1, "a queue can be used again after it was emptied")
	v, _ = q.Pop()
	check.Equal(v, "coupe", "Pop after reuse")

	var tickets Queue[Wash]
	w, ok := tickets.Pop()
	check.Equal(w, Wash{}, "the value Pop returns from an empty Queue[Wash]")
	check.True(!ok, "Pop on an empty Queue[Wash] reports false")

	nums := &Queue[int]{}
	nums.Push(4)
	nums.Push(15)
	nums.Pop()
	nums.Push(9)
	check.Equal(nums.Map(strconv.Itoa), []string{"15", "9"}, "Map after a Pop and another Push")
}
