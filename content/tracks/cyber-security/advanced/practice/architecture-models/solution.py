"""Policy check for Sunmeadow Solar's Terraform plans, run before terraform apply."""
import json

ADMIN_PORTS = {22, 3306, 3389, 5432}


def open_admin_ports(rule):
    """Return the sorted admin ports an ingress rule's `after` object opens to 0.0.0.0/0 or ::/0."""
    world = rule.get("cidr_ipv4") == "0.0.0.0/0" or rule.get("cidr_ipv6") == "::/0"
    if not world:
        return []
    protocol = rule.get("ip_protocol")
    if protocol == "-1":
        return sorted(ADMIN_PORTS)
    if protocol != "tcp":
        return []
    low, high = rule["from_port"], rule["to_port"]
    return sorted(port for port in ADMIN_PORTS if low <= port <= high)


def as_list(value):
    return value if isinstance(value, list) else [value]


def is_wildcard_policy(policy_text):
    """Return True when an Allow statement of the JSON policy grants "*", "service:*" or Resource "*"."""
    policy = json.loads(policy_text)
    for statement in as_list(policy.get("Statement", [])):
        if statement.get("Effect") != "Allow":
            continue
        actions = as_list(statement.get("Action", []))
        resources = as_list(statement.get("Resource", []))
        if any(action == "*" or action.endswith(":*") for action in actions) or "*" in resources:
            return True
    return False


def review_plan(plan):
    """Return the DRIFT findings, then the DENY findings of the creates and updates, in plan order."""
    findings = [f"DRIFT {entry['address']}" for entry in plan.get("resource_drift", [])]
    for entry in plan.get("resource_changes", []):
        actions = entry["change"]["actions"]
        if "create" not in actions and "update" not in actions:
            continue
        after = entry["change"]["after"]
        address = entry["address"]
        kind = entry["type"]
        if kind == "aws_vpc_security_group_ingress_rule":
            ports = open_admin_ports(after)
            if ports:
                findings.append(f"DENY {address} open-admin {','.join(map(str, ports))}")
        elif kind in ("aws_iam_role_policy", "aws_iam_policy"):
            if is_wildcard_policy(after["policy"]):
                findings.append(f"DENY {address} iam-wildcard")
        elif kind == "aws_db_instance":
            if after.get("publicly_accessible") is True:
                findings.append(f"DENY {address} db-public")
            if after.get("storage_encrypted") is not True:
                findings.append(f"DENY {address} db-unencrypted")
    return findings
