Parcelo's checkout API runs on a dozen hosts. Each host records the latency of every request it
serves as a pair: the endpoint, and the time taken in milliseconds.

```text
("/checkout", 120)
("/cart",      35)
("/checkout", 480)
```

The on-call dashboard needs three numbers per endpoint: how many requests there were, the
slowest one, and the mean. Next quarter the team wants percentiles, and after that something
nobody has thought of yet. The code that groups samples by endpoint should not have to change
each time a statistic is added.

You are writing the roll-up component: one small trait that says what a statistic is, and one
generic container that keeps a statistic per key. Every host builds its own roll-up, so two
roll-ups must also merge into one without losing accuracy. The mean of two means is not the
mean of the samples.
