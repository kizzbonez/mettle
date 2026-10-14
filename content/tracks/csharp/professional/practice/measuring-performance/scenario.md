A search team's CI flags a "slow" build about once a week, always from a single `Stopwatch`
reading, and nobody believes the numbers any more. You are building the small measuring kit the
team's tests will use instead: medians of warmed-up samples, and allocation budgets that do not
depend on how busy the build machine is.
