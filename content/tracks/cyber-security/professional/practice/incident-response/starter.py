"""Rebuild an incident's timeline in UTC and check the response against the playbook."""
import json
from datetime import datetime, timezone


def timeline(path):
    """Return "TIME [PHASE] ACTION HOST" strings in UTC time order."""
    # YOUR CODE: read each non-blank line with json.loads, convert its time to UTC,
    # clean phase and host (strip, lower), sort by time, then format the strings.
    raise NotImplementedError


def check_response(path):
    """Return the findings of the playbook checks, in the order of the instructions."""
    # YOUR CODE: 1. brief within 60 minutes of the first declare-incident
    #            2. POWER-OFF HOST   3. NO-MEMORY HOST   4. notify-authority within 72 hours
    raise NotImplementedError
