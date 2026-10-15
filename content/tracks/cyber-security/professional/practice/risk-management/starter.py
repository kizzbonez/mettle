"""Score risks, value controls and check the treatments in a risk register."""
import json

TREATMENTS = {"mitigate", "transfer", "accept", "avoid"}


def rate(likelihood, impact):
    """Return (score, band) from the five-by-five matrix."""
    # YOUR CODE: ValueError unless both are ints from 1 to 5; bands L 1-4, M 5-9, H 10-15, C 16-25.
    raise NotImplementedError


def control_value(asset_value, exposure_factor, aro, ef_after, aro_after, annual_cost):
    """ALE before minus ALE after minus the control's annual cost, to 2 decimals."""
    # YOUR CODE
    raise NotImplementedError


def check_register(path):
    """Return the findings for the register at PATH, risk by risk."""
    # YOUR CODE: json.load the list, then for each risk in order:
    #   NO-OWNER, BAD-TREATMENT, and for "accept": ACCEPT-TOO-HIGH, NEEDS-BOARD, UNSIGNED;
    #   for "mitigate": NOT-WORTH.
    raise NotImplementedError
