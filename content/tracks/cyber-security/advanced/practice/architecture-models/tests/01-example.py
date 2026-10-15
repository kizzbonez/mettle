# The example from the instructions.
import json

with open("data/plan.json") as handle:
    plan = json.load(handle)

assert open_admin_ports({"cidr_ipv4": "0.0.0.0/0", "from_port": 22, "to_port": 22, "ip_protocol": "tcp"}) == [22], (
    "open_admin_ports for the admin_ssh rule (port 22 from 0.0.0.0/0)"
)
assert open_admin_ports({"cidr_ipv4": "0.0.0.0/0", "from_port": 443, "to_port": 443, "ip_protocol": "tcp"}) == [], (
    "open_admin_ports for the web_https rule (port 443 only)"
)
assert is_wildcard_policy('{"Statement": {"Effect": "Allow", "Action": "s3:*", "Resource": "arn:aws:s3:::sunmeadow-reports/*"}}') is True, (
    "is_wildcard_policy for the report_export policy (Action s3:*)"
)

got = review_plan(plan)
expected = [
    "DRIFT aws_security_group.portal",
    "DENY aws_vpc_security_group_ingress_rule.admin_ssh open-admin 22",
    "DENY aws_vpc_security_group_ingress_rule.ops_rdp_v6 open-admin 3389",
    "DENY aws_iam_role_policy.report_export iam-wildcard",
    "DENY aws_db_instance.analytics db-public",
    "DENY aws_db_instance.analytics db-unencrypted",
]
assert got == expected, f"review_plan(data/plan.json) should give the findings in the instructions, got {got!r}"
