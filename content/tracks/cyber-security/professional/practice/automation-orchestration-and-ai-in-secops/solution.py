"""A guardrail that checks every action an AI triage agent proposes."""
import json
from datetime import datetime


def seconds_between(earlier_time, later_time):
    return (datetime.fromisoformat(later_time) - datetime.fromisoformat(earlier_time)).total_seconds()


def check_action(policy, action, earlier):
    """Return the decision for ACTION, given the actions allowed EARLIER."""
    settings = policy["tools"].get(action["tool"])
    if settings is None or not settings.get("allowed", False):
        return "deny: tool not allowed"
    args = action.get("args", {})
    if "max_rows" in settings and args.get("rows", 0) > settings["max_rows"]:
        return "deny: too many rows"
    if args.get("host") in policy.get("protected_hosts", []):
        return "deny: protected host"
    role = settings.get("requires_approval")
    if role and action.get("approved_by") != role:
        return f"hold: needs approval by {role}"
    limit = settings.get("max_per_hour")
    if limit is not None:
        recent = [
            other for other in earlier
            if other["tool"] == action["tool"] and seconds_between(other["time"], action["time"]) < 3600
        ]
        if len(recent) >= limit:
            return "deny: rate limit"
    return "allow"


def review_actions(policy_path, actions_path):
    """Check every action in ACTIONS_PATH in order; return "ID DECISION" strings."""
    with open(policy_path) as f:
        policy = json.load(f)
    allowed = []
    results = []
    with open(actions_path) as f:
        for line in f:
            if not line.strip():
                continue
            action = json.loads(line)
            decision = check_action(policy, action, allowed)
            if decision == "allow":
                allowed.append(action)
            results.append(f"{action['id']} {decision}")
    return results
