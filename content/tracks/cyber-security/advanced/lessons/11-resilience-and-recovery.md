---
title: Resilience and Recovery
summary: Design for failure with hot, warm and cold sites, platform diversity, load balancing, clustering, autoscaling and redundant power, protect backups with retention, immutability and restore tests, test with simulations, failover and parallel processing, and calculate RTO, RPO, MTTR, MTBF and availability with worked numbers (SY0-801 objective 3.4).
minutes: 40
objectives:
  - Define RTO, RPO, MTTR and MTBF and calculate availability and worst-case data loss from them
  - Choose a hot, warm or cold site and the redundancy (load balancing, clustering, autoscaling, multicloud, power) a recovery objective requires
  - Design backups with the right scope, retention and immutability, and prove them with restoration tests
  - Distinguish business continuity from disaster recovery and plan tests and capacity for both
---

## Outline

1. Continuity and recovery
2. Recovery metrics, with numbers
3. Alternate sites
4. Redundancy, diversity and power
5. Storage and backups
6. Testing and capacity planning

## Continuity and recovery

**Business continuity (BC)** keeps the essential business functions running during and after a disruption: people, processes, facilities and suppliers as well as IT. **Disaster recovery (DR)** is the part that restores IT systems and data after a disaster. A hospital's continuity plan says how admissions continue on paper when the patient system is down; its DR plan says how the patient system comes back.

## Recovery metrics, with numbers

NIST SP 800-34 defines the time objectives:

- **Maximum tolerable downtime (MTD)**: the longest outage of a business process the owner will accept.
- **Recovery time objective (RTO)**: the longest a system can stay unavailable before the impact is unacceptable; it must fit inside the MTD.
- **Recovery point objective (RPO)**: the point in time to which data must be recoverable, that is, the maximum acceptable data loss.

Two measured values describe how equipment behaves: **mean time between failures (MTBF)**, the average operating time between failures of a repairable component, and **mean time to repair (MTTR)**, the average time to restore it. Availability follows: **availability = MTBF / (MTBF + MTTR)**. A booking service has an RTO and an RPO of four hours:

```python
HOURS_PER_YEAR = 8760

mtbf, mttr = 2190, 6  # hours: one node fails about every 3 months, takes 6 h to repair
single = mtbf / (mtbf + mttr)
pair = 1 - (1 - single) ** 2  # two independent nodes, either one can carry the load
for name, a in [("one node", single), ("two nodes", pair)]:
    down = (1 - a) * HOURS_PER_YEAR
    print(f"{name:9}  availability {a:.5%}  expected downtime {down:6.2f} h/year ({down * 60:7.1f} min)")

rpo_hours, rto_hours = 4, 4
for method, interval in [("nightly backup", 24), ("log shipping", 0.25)]:
    verdict = "meets" if interval <= rpo_hours else "MISSES"
    print(f"{method:15} worst-case data loss {interval:5.2f} h  {verdict} RPO of {rpo_hours} h")

restore = 5 + 20 / 60  # measured in the last restore test: 5 h 20 min
print(f"restore test {restore:.2f} h  {'meets' if restore <= rto_hours else 'MISSES'} RTO of {rto_hours} h")
```

```text
one node   availability 99.72678%  expected downtime  23.93 h/year ( 1436.1 min)
two nodes  availability 99.99925%  expected downtime   0.07 h/year (    3.9 min)
nightly backup  worst-case data loss 24.00 h  MISSES RPO of 4 h
log shipping    worst-case data loss  0.25 h  meets RPO of 4 h
restore test 5.33 h  MISSES RTO of 4 h
```

One node gives 2190 / 2196 = 99.73%, about 24 hours of downtime a year. A second node, if failures are independent, cuts that to four minutes: redundancy multiplies small probabilities. A nightly backup can lose 24 hours of bookings and misses the RPO; shipping database logs every 15 minutes meets it. The last restore took 5 h 20 min, so the RTO is a wish until restores get faster. Lowering MTTR (spares on site, automated rebuilds) raises availability as surely as raising MTBF.

## Alternate sites

When a whole site is lost, work moves elsewhere. NIST SP 800-34 describes:

- A **cold site**: space, power, telecommunications and environmental controls, but no systems. Cheapest; recovery takes days to weeks.
- A **warm site**: partially equipped with some or all of the hardware, software and connections. Recovery in hours to days.
- A **hot site**: fully equipped and staffed, with current data. Recovery in minutes to hours, at the highest cost. A **mirrored site**, with real-time replication, is the extreme.

Choose from the RTO: a four-hour RTO rules out a cold site. **Environmental** considerations decide where it goes: not on the primary's flood plain, power grid, fault line or storm path, yet reachable by staff, close enough to replicate, and in a jurisdiction where the data may legally sit.

## Redundancy, diversity and power

Redundancy removes single points of failure. **Load balancing** spreads requests across servers and stops using one that fails its health checks. In nginx:

```nginx
upstream booking {
    least_conn;
    server 10.30.0.21:8080 max_fails=3 fail_timeout=30s;
    server 10.30.0.22:8080 max_fails=3 fail_timeout=30s;
    server 10.40.0.21:8080 backup;
}
```

Requests go to the less busy of the first two; a server that fails three times in 30 seconds is skipped for 30 seconds; the `backup` server at the second site is used only when both are down.

- **Clustering** runs several servers as one service: **active-active** shares the load, **active-passive** keeps a standby that takes over (failover).
- **Autoscaling** adds and removes instances with demand, so a peak or a lost instance does not exhaust capacity.
- **High availability (HA)** is the goal behind them, stated in "nines": 99.99% allows about 53 minutes of downtime a year.
- **Multicloud systems** survive one provider's regional outage or a compromised account, at the cost of complexity.

Identical redundant parts can fail identically: one firmware bug or hypervisor flaw hits every copy. **Platform diversity** mixes **vendor platforms**, **hardware** and **virtualization** technologies where a common failure would be catastrophic, such as backups on a different storage vendor and hypervisor from production.

Power needs layers: a **surge protector** absorbs spikes; an **uninterruptible power supply (UPS)** carries the load on batteries through short outages and until the generator starts; a **redundant power supply (RPS)** gives a server two supplies fed from different circuits; a **generator** runs the site through long outages, if it has fuel and has been tested under load.

## Storage and backups

**RAID** (redundant array of independent disks) keeps a server running when a disk fails: RAID 1 mirrors, RAID 5 and 6 add one or two parity disks, RAID 10 mirrors and stripes. **Replication** copies data to another system or site. Neither is a backup: a deleted or encrypted file is mirrored and replicated instantly.

**Backups** are separate, versioned copies, designed in four parts:

- **Scope**: data, plus configuration, IaC templates, encryption keys and the restore documentation. A database backup without its key is useless.
- **Retention**: how long each copy is kept, often in generations (daily for weeks, monthly for a year), set by the RPO, by how long an intrusion might go unnoticed, and by legal rules.
- **Immutability**: copies nobody can change or delete before their retention ends. Ransomware operators destroy every backup they can reach; CISA advises offline, encrypted backups and object lock. In Amazon S3, compliance-mode Object Lock blocks deletion "by any user, including the root user".
- **Restoration testing**: restore regularly into an isolated environment, check the data and time it against the RTO, as the script above does.

```console
$ aws s3api put-object-lock-configuration --bucket clinic-backups-eu \
    --object-lock-configuration '{"ObjectLockEnabled": "Enabled", "Rule": {"DefaultRetention": {"Mode": "COMPLIANCE", "Days": 35}}}'
```

## Testing and capacity planning

Untested plans fail when needed. Security+ names three tests:

- **Simulation**: walk through a scenario with the teams (a tabletop exercise) without touching production.
- **Failover**: actually switch a service to its secondary and back, measuring the time.
- **Parallel processing**: run the recovery systems alongside production on the same real inputs and compare results, proving the alternate site without risking an outage.

**Capacity planning** makes sure recovery has enough **people** (cross-trained staff, because the one person who knows the restore may be away), **technology** (licenses, compute and storage for the full load at the alternate site) and **infrastructure** (bandwidth for replication and users, rack space, power).

## Common mistakes

- Treating RAID, replication or same-system snapshots as backups.
- Backups on a share the compromised domain admin can delete.
- An RTO written in the plan but never measured by a restore.
- Two "redundant" links in one duct, or two power supplies on one circuit.
- A hot site without capacity for the whole production load.

## Practice

1. A storage controller has an MTBF of 4,000 hours and an MTTR of 8 hours. What is its availability?
2. Orders are written all day, the RPO is one hour, and backups run at midnight. Is the RPO met, and what would meet it?
3. Payroll's RTO is 72 hours and the budget is small. Which site type fits?
4. Which test proves a DR site can process real transactions without risking production?

### Answers

1. 4000 / 4008 = 0.998, about 99.80%.
2. No: up to 24 hours of orders could be lost. Replicate or ship database logs at least hourly, keeping nightly backups for older restore points.
3. A cold or warm site; 72 hours leaves time to restore onto prepared equipment.
4. A parallel processing test.

## Key takeaways

- RTO bounds downtime, RPO bounds data loss, both inside the MTD; availability = MTBF / (MTBF + MTTR).
- Hot, warm and cold sites trade cost against recovery time; place them away from the primary's hazards.
- Load balancing, clustering, autoscaling, multicloud and layered power remove single points of failure; diversity avoids identical failures.
- Backups need scope, retention, immutability and a timed restore test.
- Test with simulations, failovers and parallel processing; plan capacity for people, technology and infrastructure.

## Further reading

- [NIST SP 800-34 Rev. 1: Contingency Planning Guide for Federal Information Systems](https://csrc.nist.gov/pubs/sp/800/34/r1/upd1/final)
- [CISA #StopRansomware Guide](https://www.cisa.gov/stopransomware/ransomware-guide)
- [Amazon S3: Locking objects with Object Lock](https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lock.html)
- [nginx: ngx_http_upstream_module](https://nginx.org/en/docs/http/ngx_http_upstream_module.html)
