"""Policy check for Sunmeadow Solar's Terraform plans, run before terraform apply."""
import json

ADMIN_PORTS = {22, 3306, 3389, 5432}


def open_admin_ports(rule):
    """Return the sorted admin ports an ingress rule's `after` object opens to 0.0.0.0/0 or ::/0."""
    # YOUR CODE: world source? then "-1" (all ports), "tcp" (from_port..to_port) or nothing.
    raise NotImplementedError


def is_wildcard_policy(policy_text):
    """Return True when an Allow statement of the JSON policy grants "*", "service:*" or Resource "*"."""
    # YOUR CODE: json.loads, then each statement (one object or a list).
    raise NotImplementedError


def review_plan(plan):
    """Return the DRIFT findings, then the DENY findings of the creates and updates, in plan order."""
    # YOUR CODE
    raise NotImplementedError
