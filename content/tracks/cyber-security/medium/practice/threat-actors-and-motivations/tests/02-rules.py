# classify(): each rule, the order between them, and values in mixed case with spaces.
def incident(origin="external", intent="malicious", motivation="unknown", resources="medium",
             sophistication="medium"):
    return {"id": "X", "opened": "2026-10-01", "summary": "test", "origin": origin, "intent": intent,
            "motivation": motivation, "resources": resources, "sophistication": sophistication,
            "dwell_days": "0"}


cases = [
    (incident(origin="internal", intent="none", motivation="none", resources="own access"), "accidental insider",
     "an internal incident with no intent"),
    (incident(origin="internal", motivation="financial", resources="very high"), "insider",
     "an internal malicious incident, whatever its motive and resources (rule 1 comes first)"),
    (incident(origin="Internal ", intent=" NONE"), "accidental insider",
     "origin and intent in mixed case with spaces"),
    (incident(motivation="fear/chaos", resources="very high"), "terrorist",
     "fear/chaos with very high resources (rule 2 comes before rule 3)"),
    (incident(motivation="financial", resources="very high"), "state-sponsored",
     "a financial motive with very high resources (rule 3 comes before rule 5)"),
    (incident(motivation="influence", resources="low"), "state-sponsored",
     "an influence motive"),
    (incident(motivation="political", resources="low", sophistication="low"), "hacktivist",
     "a political motive with low sophistication (rule 4 comes before rule 7)"),
    (incident(motivation=" Ideological"), "hacktivist", "an ideological motive"),
    (incident(motivation="extortion", resources="high"), "crime syndicate", "an extortion motive"),
    (incident(motivation="Financial", sophistication="low"), "crime syndicate",
     "a financial motive with low sophistication (rule 5 comes before rule 7)"),
    (incident(motivation="intellectual property", resources="high"), "competitor",
     "an intellectual property motive without very high resources"),
    (incident(motivation="intellectual property", resources="Very High"), "state-sponsored",
     "an intellectual property motive with very high resources"),
    (incident(motivation="notoriety", resources="very low", sophistication="LOW"), "unskilled attacker",
     "notoriety with low sophistication"),
    (incident(motivation="revenge", sophistication="low"), "unskilled attacker",
     "an external actor with another motive and low sophistication"),
    (incident(motivation="notoriety", sophistication="medium"), "unknown",
     "notoriety with medium sophistication matches no rule"),
    (incident(motivation="ethical", sophistication="high"), "unknown",
     "an ethical motive with high sophistication matches no rule"),
]
for row, expected, what in cases:
    assert classify(row) == expected, f"classify: {what}"
