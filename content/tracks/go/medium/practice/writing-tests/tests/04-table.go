// tableRule is a broken version of the charge, named after the rule it breaks.
type tableRule struct {
	breaks string
	charge func(daysLate int) int
}

// rightCharge is the charge as the rules state it.
func rightCharge(daysLate int) int {
	if daysLate <= 1 {
		return 0
	}
	return min((daysLate-1)*150, 1200)
}

func Test(t *testing.T) {
	cases := chargeCases()
	check.True(len(cases) >= 6, "the table has at least six cases")

	seen := map[string]bool{}
	for _, c := range cases {
		check.True(c.name != "", "every case has a name")
		check.True(!seen[c.name], "no two cases share a name")
		seen[c.name] = true
		check.Equal(c.want, rightCharge(c.days), "the want of the case named "+c.name+" follows the rules")
	}

	broken := []tableRule{
		{"the grace day (it charges from the first day late)", func(d int) int {
			if d <= 0 {
				return 0
			}
			return min(d*150, 1200)
		}},
		{"the first charged day (it gives two grace days)", func(d int) int {
			if d <= 2 {
				return 0
			}
			return min((d-1)*150, 1200)
		}},
		{"early returns (it charges a negative amount)", func(d int) int {
			if d == 0 || d == 1 {
				return 0
			}
			return min((d-1)*150, 1200)
		}},
		{"the cap (it has none)", func(d int) int {
			if d <= 1 {
				return 0
			}
			return (d - 1) * 150
		}},
		{"the cap (it stops one day too early)", func(d int) int {
			if d <= 1 {
				return 0
			}
			return min((d-1)*150, 1050)
		}},
	}
	for _, b := range broken {
		caught := false
		for _, c := range cases {
			if b.charge(c.days) != c.want {
				caught = true
			}
		}
		check.True(caught, "the table catches a charge that breaks "+b.breaks)
	}
}
