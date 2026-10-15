Brookfield School put a carbon dioxide monitor in five of its rooms last winter. CO2 builds up
when a room full of people is not aired, so the readings tell the caretaker which rooms need a
window opened or the ventilation looked at, and the school's policy flags any reading of
1500 ppm or more.

Each monitor reports every half hour to a small gateway, and every evening the gateway uploads
one CSV file for the day:

```text
sensor,time,co2_ppm,temp_c
AQ-01,2026-03-02 09:00,572,19.0
 aq-02,2026-03-02 09:00,652,19.2
AQ-03,2026-03-02 09:00,560,19.5
```

The files are not clean. One gateway was re-flashed and writes sensor ids in lower case with
stray spaces. A monitor moved to the staff room still reports under an id nobody registered. A
misconfigured gateway writes day-first dates, sensors glitch to impossible values, the Hall's
thermometer failed on Tuesday, and when an upload is interrupted the gateway sends some readings
again, sometimes at the top of the next day's file.

Until now Ms Okoye, the business manager, pasted the files into a spreadsheet and fixed them by
hand. You are writing the pipeline that replaces her Friday afternoon: a program that reads the
day files, checks every row against the rules the school agreed, sets the bad rows aside with the
reason each one failed, stores the clean readings and a daily summary in Parquet for the
governors' dashboard, and prints a short report she can paste into her weekly email.
