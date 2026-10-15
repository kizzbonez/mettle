Brightwater village hall put solar panels on its south roof last spring, paid for by two years
of jumble sales. The panels are wired in **strings**, groups of panels that each feed the
inverter separately, and a small logger in the kitchen cupboard writes one line a day: the
day of the month and the energy, in kilowatt-hours (kWh), that each string produced.

```text
day,s1,s2,s3,s4,s5,s6
1,6.2,6.5,6.6,6.4,4.4,6.5
...
6,7.2,7.1,7.3,ERR,5.1,7.7
...
9,,,,,,
```

The logger is cheap and it shows. Some days it misses a reading and leaves the field empty, or
writes `ERR`. On the 9th it lost power and wrote nothing at all. It writes `-1.0` when a
string's meter does not answer, and after a meter reset it once claimed 98.6 kWh for a string
that cannot make more than 12 kWh on the brightest day. On the 17th every string shows 0.0:
the electrician switched the inverter off to fit a new isolator, and those zeros are real.

The hall committee wants to know three things before its next meeting: how much the roof
produced each day, whether any string is pulling its weight less than the others (the
treasurer suspects the ash tree by the car park), and which days the volunteer electrician
should check by hand against the inverter's own display. You are writing the NumPy module
that answers them, starting with June's file.
