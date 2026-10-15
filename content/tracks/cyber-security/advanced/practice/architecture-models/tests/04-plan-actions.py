# review_plan: which actions are checked, replacements, missing keys, order and other resource types.
import json


def change(address, actions, after):
    kind, name = address.split(".")
    return {"address": address, "mode": "managed", "type": kind, "name": name,
            "change": {"actions": actions, "before": None, "after": after}}


wide = {"cidr_ipv4": "0.0.0.0/0", "ip_protocol": "-1"}
star = json.dumps({"Statement": [{"Effect": "Allow", "Action": "*", "Resource": "*"}]})
plan = {
    "format_version": "1.2",
    "resource_changes": [
        change("aws_vpc_security_group_ingress_rule.gone", ["delete"], None),
        change("aws_vpc_security_group_ingress_rule.same", ["no-op"], wide),
        change("aws_vpc_security_group_ingress_rule.lookup", ["read"], wide),
        change("aws_vpc_security_group_ingress_rule.swap_a", ["delete", "create"], wide),
        change("aws_iam_policy.ops", ["create", "delete"], {"name": "ops", "policy": star}),
        change("aws_db_instance.installers", ["update"], {"identifier": "installers", "publicly_accessible": False}),
        change("aws_db_instance.inverters", ["create"], {"identifier": "inverters", "publicly_accessible": True, "storage_encrypted": True}),
        change("aws_s3_bucket.logs", ["create"], {"bucket": "sunmeadow-logs", "policy": star}),
        change("aws_iam_role_policy.ok", ["update"], {"name": "ok", "policy": json.dumps({"Statement": []})}),
    ],
}
got = review_plan(plan)
expected = [
    "DENY aws_vpc_security_group_ingress_rule.swap_a open-admin 22,3306,3389,5432",
    "DENY aws_iam_policy.ops iam-wildcard",
    "DENY aws_db_instance.installers db-unencrypted",
    "DENY aws_db_instance.inverters db-public",
]
assert got == expected, (
    "review_plan on a plan without resource_drift: only creates, updates and replacements are checked, "
    "a database without storage_encrypted counts as unencrypted, and other resource types give no finding"
)

assert review_plan({"resource_drift": [], "resource_changes": []}) == [], "review_plan on an empty plan"

drift_only = {
    "resource_drift": [
        {"address": "aws_route53_record.www", "type": "aws_route53_record", "change": {"actions": ["update"]}},
        {"address": "aws_lambda_function.refunds", "type": "aws_lambda_function", "change": {"actions": ["update"]}},
    ],
    "resource_changes": [change("aws_db_instance.ledger", ["create"], {"publicly_accessible": False, "storage_encrypted": False})],
}
assert review_plan(drift_only) == [
    "DRIFT aws_route53_record.www",
    "DRIFT aws_lambda_function.refunds",
    "DENY aws_db_instance.ledger db-unencrypted",
], "review_plan lists every drift entry first, in order, then the DENY findings"
