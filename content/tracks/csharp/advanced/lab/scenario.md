Larkspur Clinic runs six practices and sends every patient a text message the evening before an
appointment. Missed appointments fell by a third when the reminders started, so the front desk
notices at once when they stop working.

```text
Hello Ada Lovelace, this is Larkspur Clinic. Your appointment is on 2026-10-15 at 09:30.
```

The old script sent the messages one at a time and took forty minutes on a busy evening. Its
replacement sent all six hundred at once, the SMS gateway answered "busy" to most of them, and
the script treated every "busy" as a failure. Patients with a disconnected number were retried
all night. And when the operator pressed Stop, half the evening's messages went out anyway.

You are writing the piece in the middle: a dispatcher that sends the reminders in batches the
gateway can cope with, tries again when the gateway is busy but not when a number is dead,
stops cleanly when asked, tells the front-desk dashboard about every message that went out,
and hands back a report in the same order as the appointment list, because the front desk
reads it side by side with the day's schedule.
