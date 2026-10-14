Northwind Lettings runs its billing, CRM and HR databases on one server. Every night a job dumps
each database into `/srv/backups`, one compressed file per database per night:

```text
billing-2026-10-13.sql.gz
billing-2026-10-14.sql.gz
crm-eu-2026-10-14.sql.gz
sales team-2026-10-14.sql.gz
```

Nobody ever deleted anything, and last month the disk filled up during the night. The billing
dump failed halfway and nobody noticed for three days. The clean-up script someone wrote in a
hurry afterwards ran `rm $(ls -t | tail -n +4)`: it split `sales team-...` into two names, and
it kept the three newest files in the whole directory, not of each database, so the CRM backups
were all deleted on the first night.

The operations lead wants a proper tool before it goes into `cron`. It must keep a few backups of
**every** database and every recent one, show its plan before anyone trusts it with real files,
leave a report the monitoring system can read without ever seeing half of one, and fail loudly
and cleanly. It will be reviewed with ShellCheck before it is allowed on the server.
