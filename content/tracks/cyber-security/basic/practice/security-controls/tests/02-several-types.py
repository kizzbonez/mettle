# Cells naming several types, in any case and with spaces, cover every type they name.
with open("t2-register.csv", "w", encoding="utf-8") as f:
    f.write(
        "asset,category,type,control\n"
        "payroll,technical, Detective ; CORRECTIVE ,Database audit log with point-in-time restore\n"
        "payroll,managerial,Preventive,Two partners approve every new payee\n"
        "reception,physical,deterrent;Detective,Visible camera over the reception desk\n"
        "reception,operational,preventive,Visitors sign in and wear a badge\n"
        "backups,technical,corrective;,Weekly copy to an offline drive\n"
    )

gaps = find_gaps(read_register("t2-register.csv"))
assert "payroll" not in gaps, "a type cell such as ' Detective ; CORRECTIVE ' should count as both types"
assert gaps.get("reception") == ["corrective"], "an asset whose cells name preventive and detective still lacks corrective"
assert gaps.get("backups") == ["preventive", "detective"], "an asset with only a corrective control lacks the other two"
assert list(gaps) == ["reception", "backups"], "only assets with gaps, in register order"
