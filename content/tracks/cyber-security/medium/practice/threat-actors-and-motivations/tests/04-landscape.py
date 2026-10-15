# landscape(): another register, with mixed case, quoted summaries and empty dwell times.
from pathlib import Path

Path("t4-register.csv").write_text(
    "id,opened,summary,origin,intent,motivation,resources,sophistication,dwell_days\n"
    'R-9,2026-01-04,"Ransom note, files encrypted",external,malicious,Extortion,high,medium,4\n'
    "R-2,2026-02-11,Credential theft from mayor's office,External,malicious,espionage,Very High,very high,180\n"
    "R-5,2026-03-02,Wrong attachment sent to press,INTERNAL,none,none,own access,low,\n"
    "R-1,2026-04-19,Mailbox rules hiding invoices,external,malicious,financial,high,high,120\n"
    "R-7,2026-05-30,Edge firewall implant,external,malicious,influence,high,high,90\n"
    "R-3,2026-06-08,Deleted case files after a dispute,internal,malicious,revenge,own access,high,200\n"
)

got = landscape("t4-register.csv")
assert isinstance(got, dict), "landscape should return a dict"
assert got.get("actors") == {"crime syndicate": 2, "state-sponsored": 2, "accidental insider": 1, "insider": 1}, (
    "actor counts for a register with mixed-case values"
)
assert got.get("internal") == 2 and got.get("external") == 4, "origins should be counted ignoring case"
assert got.get("apt") == ["R-1", "R-2", "R-7"], (
    "APT incidents sorted by id, including a financially motivated one and none of the internal ones"
)

Path("t4-quiet.csv").write_text(
    "id,opened,summary,origin,intent,motivation,resources,sophistication,dwell_days\n"
    "Q-1,2026-07-01,Laptop left on a train,internal,none,none,own access,low,0\n"
)
assert landscape("t4-quiet.csv") == {"actors": {"accidental insider": 1}, "internal": 1, "external": 0, "apt": []}, (
    "a register with one internal accident and no external incidents"
)
