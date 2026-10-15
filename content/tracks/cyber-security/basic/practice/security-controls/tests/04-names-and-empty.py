# Asset names with spaces around them, repeated rows, a fully covered register and an empty one.
with open("t4-register.csv", "w", encoding="utf-8") as f:
    f.write(
        "asset,category,type,control\n"
        "vpn ,technical,preventive,Multifactor sign-in for remote staff\n"
        " vpn,technical,detective,Alert on sign-ins from new countries\n"
        "vpn,technical,detective,Alert on sign-ins from new countries\n"
        "website,technical,preventive,Web application firewall\n"
        "website,technical,detective,Uptime and defacement monitor\n"
        "website,technical,corrective,Redeploy from the release repository\n"
        "  vpn  ,operational,corrective,Engineer on call restores the gateway configuration\n"
    )

gaps = find_gaps(read_register("t4-register.csv"))
assert gaps == {}, "asset names are compared after removing the spaces around them, so every asset here is covered"

with open("t4-empty.csv", "w", encoding="utf-8") as f:
    f.write("asset,category,type,control\n")
assert find_gaps(read_register("t4-empty.csv")) == {}, "a register with no rows has no gaps"

rows = [{"asset": "fax line", "category": "technical", "type": "directive", "control": "Only send to numbers on the list"}]
assert find_gaps(rows) == {"fax line": ["preventive", "detective", "corrective"]}, "a directive control alone covers none of the required types"
