"""Check a penetration tester's planned activities against the rules of engagement."""
import csv
import ipaddress
import json
from datetime import datetime


def in_scope(target, scope):
    """True when TARGET is inside the in-scope list and touches nothing out of scope."""
    # YOUR CODE: ipaddress.ip_network(...) for addresses and networks (ValueError: a host name),
    # subnet_of an "in" network and overlaps no "out" network; host names exact, in lower case.
    raise NotImplementedError


def review_plan(roe_path, plan_path):
    """Return "ID DECISION" for every planned activity, in plan order."""
    # YOUR CODE: forbidden, unknown technique, out of scope, outside window (active only), approved.
    raise NotImplementedError
