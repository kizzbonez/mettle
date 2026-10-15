Ashby Town Council runs public chargers for electric cars at four sites: Market Square, the
station car park, the leisure centre and the hospital visitor car park. A fifth site, the Park and
Ride, opens in the spring. Every month the charger company sends the council an export of every
charging session:

```text
Ashby Town Council public chargers, sessions export, February 2026
session_id,site,connector,started,kwh,minutes,status
S2601,LEI,Type 2,2026-02-01 14:35,14.53,135,ok
S2605,stn,CHAdeMO,2026-02-03 17:25,13.06,19,ok
S2611,STN,CCS,2026-02-05 07:20,11.96,unknown,ok
S2619,HSP,CCS,2026-02-09 11:45,-,29,ok
S2643,STN,Type 2,2026-02-19 15:45,-,5,fault
```

The file starts with a title line. Older chargers write their site code in lower case, a meter
that did not report leaves the energy empty or writes `-`, and a session whose length was lost
says `unknown` or `?`. A session ends `ok`, `aborted` (the driver stopped it early) or `fault`
(the charger failed).

The prices per kWh live in a small JSON file the council keeps for its website. Until now an
officer copied the export into a spreadsheet each month, fixed it by hand and added up each site.
The figures go to the transport committee, so they must be right and come out the same every
time. You are writing the module that does it: it reads the export, fixes the types and the
missing values, prices every session, and builds the per-site table the committee reads.
