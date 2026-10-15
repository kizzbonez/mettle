The Ridgeway Beekeepers keep their hives at three apiaries: a pear orchard, a stretch of heath
and the flat roof of the town's market hall. This spring they put an electronic scale under
seven of the hives. A hive's weight tells a beekeeper a lot without opening it: a colony
bringing in nectar gains a kilo or more a day during a good **nectar flow**, a hive that loses
weight steadily may be short of food or queenless, and a sudden drop of several kilos usually
means half the colony has left in a **swarm**.

Every scale reports to a small gateway, which uploads one CSV file per month. The export is
**wide**: one row per reading time, in UTC because the gateway's clock knows nothing about
British Summer Time, and one column per scale.

```text
time_utc,H01,H02,H03,H04,H05,H06,H07,H09
2026-05-01T05:30Z,34.5,31.2,28.9,41.2,38.7,36.5,33.1,19.9
2026-05-01T11:30Z,34.2,30.8,28.5,41.0,38.3,36.0,32.6,19.7
...
2026-05-02T11:30Z,35.1,ERR,28.3,41.2,38.4,36.6,33.0,19.6
...
2026-05-04T17:30Z,37.6,33.5,28.5,42.3,39.5,38.4,,20.3
```

Real hardware is messy. A scale that loses its connection leaves an empty cell or writes
`ERR`; the gateway itself was down for a whole day in May; `H09` is a spare scale the
secretary set up in her shed to test the batteries, and is not under any hive. The hive
register, `hives.csv`, was typed by hand over three seasons, so some hive ids have stray spaces
or lower-case letters, and it lists `H08`, a new colony whose scale has not arrived yet. A
second small file, `apiaries.csv`, names the apiaries.

The association wants a season report it can trust: which scales sent readings that belong to
no hive, each hive's weight day by day on the clock the beekeepers live by, and a table that
ranks the colonies by how much weight they gained, so they know where to add honey boxes and
which hive to inspect first. You are writing the module that produces it.
