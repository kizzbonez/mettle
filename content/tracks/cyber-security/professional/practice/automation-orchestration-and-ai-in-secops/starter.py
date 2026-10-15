"""A guardrail that checks every action an AI triage agent proposes."""
import json
from datetime import datetime


def check_action(policy, action, earlier):
    """Return the decision for ACTION, given the actions allowed EARLIER."""
    # YOUR CODE: apply the rules in the order of the table; the first that applies wins.
    #   deny: tool not allowed / deny: too many rows / deny: protected host /
    #   hold: needs approval by ROLE / deny: rate limit / allow
    raise NotImplementedError


def review_actions(policy_path, actions_path):
    """Check every action in ACTIONS_PATH in order; return "ID DECISION" strings."""
    # YOUR CODE: json.load the policy, json.loads each non-blank line, and keep a list of the
    # actions allowed so far to pass to check_action.
    raise NotImplementedError
