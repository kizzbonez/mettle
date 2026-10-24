func Test(t *testing.T) {
	check.Equal(busiestDay([7]int{90, 10, 10, 10, 10, 10, 10}), 0, "a week whose Monday was busiest")
	check.Equal(busiestDay([7]int{1, 2, 3, 4, 5, 6, 7}), 6, "a week whose Sunday was busiest")
	check.Equal(busiestDay([7]int{5, 80, 3, 80, 2, 80, 1}), 1, "a tie between three days goes to the earliest")
	check.Equal(busiestDay([7]int{12, 30, 30, 8, 9, 14, 3}), 1, "a tie between Tuesday and Wednesday")
	check.Equal(busiestDay([7]int{}), 0, "a week with no hires at all")
	check.Equal(busiestDay([7]int{0, 0, 0, 0, 0, 0, 1}), 6, "a week with a single hire, on Sunday")
}
