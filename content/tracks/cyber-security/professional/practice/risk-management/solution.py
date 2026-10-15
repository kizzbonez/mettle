"""Score risks, value controls and check the treatments in a risk register."""
import json

TREATMENTS = {"mitigate", "transfer", "accept", "avoid"}


def rate(likelihood, impact):
    """Return (score, band) from the five-by-five matrix."""
    for value in (likelihood, impact):
        if not isinstance(value, int) or not 1 <= value <= 5:
            raise ValueError(f"likelihood and impact must be whole numbers from 1 to 5, not {value!r}")
    score = likelihood * impact
    if score <= 4:
        band = "L"
    elif score <= 9:
        band = "M"
    elif score <= 15:
        band = "H"
    else:
        band = "C"
    return score, band


def control_value(asset_value, exposure_factor, aro, ef_after, aro_after, annual_cost):
    """ALE before minus ALE after minus the control's annual cost, to 2 decimals."""
    before = asset_value * exposure_factor * aro
    after = asset_value * ef_after * aro_after
    return round(before - after - annual_cost, 2)


def check_register(path):
    """Return the findings for the register at PATH, risk by risk."""
    with open(path) as f:
        risks = json.load(f)
    findings = []
    for risk in risks:
        rid, owner = risk["id"], risk.get("owner", "")
        treatment = risk["treatment"].lower()
        if not owner:
            findings.append(f"NO-OWNER {rid}")
        if treatment not in TREATMENTS:
            findings.append(f"BAD-TREATMENT {rid} ({risk['treatment']})")
        if treatment == "accept":
            score, _ = rate(risk["likelihood"], risk["impact"])
            ale = risk["asset_value"] * risk["exposure_factor"] * risk["aro"]
            if score >= 16:
                findings.append(f"ACCEPT-TOO-HIGH {rid} (score {score})")
            if ale > 250_000 and risk.get("board_approved") is not True:
                findings.append(f"NEEDS-BOARD {rid} (ALE {ale:.2f})")
            signed = risk.get("signed_by", "")
            if not signed or signed != owner:
                findings.append(f"UNSIGNED {rid}")
        if treatment == "mitigate":
            control = risk["control"]
            value = control_value(risk["asset_value"], risk["exposure_factor"], risk["aro"],
                                  control["exposure_factor"], control["aro"], control["annual_cost"])
            if value <= 0:
                findings.append(f"NOT-WORTH {rid} (value {value:.2f})")
    return findings
