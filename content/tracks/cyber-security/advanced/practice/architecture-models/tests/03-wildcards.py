# is_wildcard_policy: statement and value shapes, service wildcards, Resource "*" and Deny statements.
import json


def policy(*statements, single=False):
    body = statements[0] if single else list(statements)
    return json.dumps({"Version": "2012-10-17", "Statement": body})


cases = [
    (policy({"Effect": "Allow", "Action": "*", "Resource": "*"}), True,
     "Action * on Resource *"),
    (policy({"Effect": "Allow", "Action": "*", "Resource": "arn:aws:s3:::sunmeadow-reports/*"}, single=True), True,
     "a single statement object with Action *"),
    (policy({"Effect": "Allow", "Action": ["s3:GetObject", "dynamodb:*"], "Resource": "arn:aws:dynamodb:eu-west-1:444455556666:table/Quotes"}), True,
     "a service wildcard inside an Action list"),
    (policy({"Effect": "Allow", "Action": "s3:GetObject", "Resource": ["arn:aws:s3:::sunmeadow-reports/*", "*"]}), True,
     "a Resource list that contains *"),
    (policy({"Effect": "Allow", "Action": "s3:GetObject", "Resource": "arn:aws:s3:::sunmeadow-reports/*"},
            {"Effect": "Allow", "Action": "sqs:SendMessage", "Resource": "*"}), True,
     "a second statement with Resource *"),
    (policy({"Effect": "Allow", "Action": ["s3:GetObject", "s3:PutObject"], "Resource": "arn:aws:s3:::sunmeadow-reports/*"}), False,
     "named actions on one bucket's objects (the /* inside an ARN is not Resource *)"),
    (policy({"Effect": "Allow", "Action": "s3:Get*", "Resource": "arn:aws:s3:::sunmeadow-reports/*"}), False,
     "a prefix such as s3:Get*, which is not every action of the service"),
    (policy({"Effect": "Deny", "Action": "*", "Resource": "*"},
            {"Effect": "Allow", "Action": "sqs:ReceiveMessage", "Resource": "arn:aws:sqs:eu-west-1:444455556666:survey-requests"}), False,
     "a Deny statement with wildcards next to a narrow Allow"),
    (policy(), False,
     "a policy with an empty Statement list"),
]
for text, expected, what in cases:
    got = is_wildcard_policy(text)
    assert got is expected, f"is_wildcard_policy for {what}"
