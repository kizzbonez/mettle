# is_apt(): every condition, the 90-day boundary and an empty dwell time.
def incident(origin="external", resources="very high", sophistication="very high", dwell="400"):
    return {"id": "X", "opened": "2026-10-01", "summary": "test", "origin": origin, "intent": "malicious",
            "motivation": "espionage", "resources": resources, "sophistication": sophistication,
            "dwell_days": dwell}


assert is_apt(incident()) is True, "an external, very well resourced, very sophisticated actor with 400 days of access"
assert is_apt(incident(dwell="90")) is True, "exactly 90 days of access is persistent"
assert is_apt(incident(dwell="89")) is False, "89 days of access is not persistent enough"
assert is_apt(incident(dwell=" 120 ")) is True, "dwell_days with spaces around it"
assert is_apt(incident(dwell="")) is False, "an empty dwell_days counts as 0"
assert is_apt(incident(resources="high", sophistication="high")) is True, "high resources and high sophistication qualify"
assert is_apt(incident(resources="medium")) is False, "medium resources do not qualify"
assert is_apt(incident(sophistication="medium")) is False, "medium sophistication does not qualify"
assert is_apt(incident(origin="internal")) is False, "an internal actor is never counted as an APT"
assert is_apt(incident(origin="External", resources="Very High", sophistication=" HIGH")) is True, (
    "values in mixed case with spaces"
)
