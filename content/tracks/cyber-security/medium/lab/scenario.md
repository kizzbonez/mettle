Larkfield Dental Group runs six dental clinics around Southampton. Its small IT team looks after
an online appointment booking website, an SSH jump host (`jump01`) that the practice systems
staff use to reach the booking and imaging servers, cloud sign-ins for email and Teams, and
about forty Windows workstations in reception desks, surgeries and the X-ray rooms, all with an
EDR agent.

On the morning of Wednesday 14 October 2026, the help desk took two odd calls. Hana Dlamini, the
practice manager, said her mailbox showed a sign-in from Johannesburg while she was at her desk,
and Bea Osei on reception said a "certificate update" window had flashed up and vanished. The
same morning the health sector ISAC shared a TLP:AMBER report on a loader it calls GullHook, with
hashes, domains and IP addresses.

The security lead has exported one day of evidence into `data/`:

```text
auth.log       SSH log from jump01 (rsyslog, RFC 3339 timestamps)
access.log     booking website requests (Combined Log Format)
signins.csv    cloud sign-ins with the city and coordinates of each source address
processes.csv  EDR process events from the workstations and servers
iocs.csv       the indicators from the ISAC report and the team's own list
```

Reading these by eye took most of yesterday and missed things, and the group holds patient
records, so it cannot afford to miss more. You are writing the triage module the team will run
every morning: it finds the attacks in each log, classifies them by rules everyone has agreed,
and prints a short summary that goes into the incident record.
