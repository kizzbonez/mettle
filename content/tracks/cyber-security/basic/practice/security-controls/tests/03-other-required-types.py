# find_gaps uses the required list it is given, in that list's order.
with open("t3-register.csv", "w", encoding="utf-8") as f:
    f.write(
        "asset,category,type,control\n"
        "warehouse,physical,preventive,Steel shutters locked at night\n"
        "warehouse,physical,deterring,Guard dog patrol signs\n"
        "warehouse,managerial,directive,Key holder procedure\n"
        "server room,physical,preventive,Badge reader on the door\n"
        "server room,physical,detective,Motion sensor wired to the alarm company\n"
        "car park,physical,detective,Camera recording to the server\n"
    )

required = ["directive", "deterrent", "preventive"]
gaps = find_gaps(read_register("t3-register.csv"), required)
assert "warehouse" not in gaps, "with a different required list, a 'deterring' control should count as deterrent"
assert gaps.get("server room") == ["directive", "deterrent"], "missing types should follow the order of the required list given"
assert gaps.get("car park") == ["directive", "deterrent", "preventive"], "an asset with none of the required types lacks all of them"

gaps = find_gaps(read_register("t3-register.csv"), ["detective"])
assert gaps == {"warehouse": ["detective"]}, "find_gaps with required=['detective'] should check only that type"
