You look after the computers of a small ecology research group. Out at Field Station 7, a data
logger measures air temperature and soil moisture three times a day, and once a week it uploads
everything it has into a single folder: readings as CSV files, its own log files, a few notes,
and whatever else it happened to leave behind, such as a rotated old log, a backup file, a
hidden state file and a placeholder for a camera image.

The researchers do not want to dig through that folder. They want each upload turned into a
tidy **release folder**: readings in one place, logs in another, notes in a third; data that
cannot be changed by accident; logs that only you can open; a `README.txt` at the top; and a
short summary that says at a glance how many files arrived and how many errors the logger
reported.

This week's upload is waiting for you in `data/`. Here is `ls -A data`:

```text
.upload-state.txt  2026-10-07.csv  calibration.txt  logger.log.1
2026-10-05.csv     README.txt      field-notes.txt  photo-0412.jpg
2026-10-06.csv     backup.csv.bak  logger.log       upload.log
```

Uploads from other stations arrive in folders whose names contain spaces, such as
`uploads/site B`, so your script must cope with those too. You will run it every week, so it
has to get every detail right without supervision.
