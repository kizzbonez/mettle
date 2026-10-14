Complete `solution.sh`. It is run as `bash solution.sh VMSTAT PS NCPU`. `VMSTAT` is saved
`vmstat` output, `PS` saved `ps -eo pid,user,stat,%cpu,%mem,rss,comm` output, and `NCPU` the
number of CPUs.

1. **The reports.** In `VMSTAT`, skip the header lines (first word `procs` or `r`); vmstat
   repeats them on long runs, so they can appear again further down. Of the remaining lines,
   skip the **first** one, which is the average since boot. The others are the reports. Their
   columns are `r b swpd free buff cache si so bi bo in cs us sy id wa st`.
2. **The bottleneck**, the first of these that holds, printed as `bottleneck: KIND`:
   - `memory` when `si` or `so` is above 0 in any report;
   - `io` when the average of `b` is at least 1 **and** the average of `wa` is at least 20;
   - `cpu` when the average of `r` is greater than `NCPU`, **or** the average of `id` is below 10;
   - `none` otherwise.
3. **The suspects**, from `PS` (skip its header line), each printed as `suspect: PID COMMAND`,
   where `COMMAND` is everything from the seventh column on (it can contain a space):
   - for `cpu`, the process with the highest `%CPU`;
   - for `memory`, the process with the highest `RSS`;
   - for `io`, every process whose `STAT` starts with `D`, in file order;
   - for `none`, nobody.

   For a tie, take the first process in the file.

Example: `bash solution.sh data/vmstat.txt data/ps.txt 4` prints

```text
bottleneck: io
suspect: 3307 rsync
suspect: 3311 postgres
suspect: 3320 tar
```

In the three reports `b` averages 6 and `wa` about 62. The busiest process, `node`, is not the
problem: tasks are waiting for the disk.

**Tip:** awk compares two fields as numbers when both look like numbers, but a value you built
yourself, such as a maximum kept in a variable, is safest compared with `+ 0` on both sides.
