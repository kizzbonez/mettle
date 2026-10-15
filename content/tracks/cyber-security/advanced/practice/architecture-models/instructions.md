Write three functions in `solution.py`. A plan is the JSON from `terraform show -json plan.out`,
already parsed with `json.load`. Use `ADMIN_PORTS` from the starter (`{22, 3306, 3389, 5432}`).

1. `open_admin_ports(rule)` takes the `after` object of an `aws_vpc_security_group_ingress_rule`
   and returns the sorted list of admin ports it opens to the whole internet (`[]` if none):
   - the rule is open to the world when its `cidr_ipv4` is `"0.0.0.0/0"` or its `cidr_ipv6` is
     `"::/0"`; any other source opens nothing to the world;
   - `ip_protocol` `"-1"` means all traffic: every admin port is open, and the rule has no
     `from_port` or `to_port`;
   - `"tcp"` opens the admin ports from `from_port` to `to_port`, both included;
   - any other protocol (`"udp"`, `"icmp"`) opens no admin port.
2. `is_wildcard_policy(policy_text)` takes an IAM policy as a JSON **string** and returns `True`
   when a statement whose `Effect` is `"Allow"` grants a wildcard: an `Action` that is `"*"` or
   ends with `":*"` (every action of a service, like `"s3:*"`), or a `Resource` that is `"*"`.
   `Statement` may be one object or a list of them, and `Action` and `Resource` may be one string
   or a list. `"Deny"` statements never count.
3. `review_plan(plan)` returns a list of findings:
   - first `DRIFT <address>` for each entry of `plan["resource_drift"]`, in order (the key may
     be missing; drift means someone changed the resource outside Terraform);
   - then, for each entry of `plan["resource_changes"]` in order whose `change.actions`
     contains `"create"` or `"update"` (skip `"no-op"`, `"read"` and `"delete"` alone; a
     replacement is `["delete", "create"]` or `["create", "delete"]` and is checked), using
     `change.after`:
     - type `aws_vpc_security_group_ingress_rule`: `DENY <address> open-admin <ports>` when
       `open_admin_ports` is not empty, the ports joined with commas and no spaces;
     - type `aws_iam_role_policy` or `aws_iam_policy`: `DENY <address> iam-wildcard` when its
       `policy` is a wildcard policy;
     - type `aws_db_instance`: `DENY <address> db-public` when `publicly_accessible` is `true`,
       then `DENY <address> db-unencrypted` when `storage_encrypted` is not `true` (missing
       counts as not encrypted).

Other resource types produce no finding.

**Example.** With the plan in `data/plan.json`:

```python
review_plan(json.load(open("data/plan.json")))
# ['DRIFT aws_security_group.portal',
#  'DENY aws_vpc_security_group_ingress_rule.admin_ssh open-admin 22',
#  'DENY aws_vpc_security_group_ingress_rule.ops_rdp_v6 open-admin 3389',
#  'DENY aws_iam_role_policy.report_export iam-wildcard',
#  'DENY aws_db_instance.analytics db-public',
#  'DENY aws_db_instance.analytics db-unencrypted']
```

`legacy_all` allows all traffic from anywhere, but the plan deletes it, so it is not a finding.
`ops_rdp_v6` opens ports 3380 to 3390 to `::/0`, and 3389 is in that range.

**Tip.** `isinstance(value, list)` tells a list from a single string or object.
