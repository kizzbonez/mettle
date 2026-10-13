import copy
import json


class ScriptedModel:
    """Stands in for the model: replays a fixed list of replies and records what it was shown."""

    def __init__(self, replies):
        self.replies = list(replies)
        self.seen = []

    def __call__(self, messages):
        self.seen.append(copy.deepcopy(messages))
        if not self.replies:
            return {"type": "final", "content": "(the script has no more replies)"}
        return self.replies.pop(0)


def tool_call(call_id, name, arguments):
    return {"type": "tool_call", "id": call_id, "name": name, "arguments": json.dumps(arguments)}


refunds, approvals, closed = [], [], []


def lookup_order(order_id):
    return {"order_id": order_id, "status": "delivered", "total": 129.0}


def issue_refund(order_id, amount):
    refunds.append((order_id, amount))
    return {"refund_id": "R-1", "amount": amount}


def close_account(customer_id):
    closed.append(customer_id)
    return {"closed": customer_id}


def approve(name, args):
    approvals.append((name, args))
    return True


TOOLS = {
    "lookup_order": Tool(fn=lookup_order, params={"order_id": str}),
    "issue_refund": Tool(fn=issue_refund, params={"order_id": str, "amount": float}, consequential=True),
    "close_account": Tool(fn=close_account, params={"customer_id": str}),
}
ALLOWED = {"lookup_order", "issue_refund"}
TASK = "Order A-1042 arrived damaged. Please refund it."

# --- 1. The example from the instructions -------------------------------------------

model = ScriptedModel(
    [
        tool_call("c1", "lookup_order", {"order_id": "A-1042"}),
        tool_call("c2", "issue_refund", {"order_id": "A-1042", "amount": 129.0}),
        {"type": "final", "content": "Refund R-1 for 129.00 has been issued."},
    ]
)
result = run_agent(model, TOOLS, TASK, allowed=ALLOWED, approve=approve)

print("status:", result["status"], "| steps:", result["steps"], "| answer:", result["answer"])
for message in result["messages"]:
    print("  ", message)

expected = [
    {"role": "user", "content": TASK},
    {"role": "assistant", "tool_call": {"id": "c1", "name": "lookup_order", "arguments": '{"order_id": "A-1042"}'}},
    {"role": "tool", "tool_call_id": "c1", "ok": True, "content": {"order_id": "A-1042", "status": "delivered", "total": 129.0}},
    {
        "role": "assistant",
        "tool_call": {"id": "c2", "name": "issue_refund", "arguments": '{"order_id": "A-1042", "amount": 129.0}'},
    },
    {"role": "tool", "tool_call_id": "c2", "ok": True, "content": {"refund_id": "R-1", "amount": 129.0}},
    {"role": "assistant", "content": "Refund R-1 for 129.00 has been issued."},
]

assert result["status"] == "completed", f"status should be 'completed', got {result['status']!r}"
assert result["answer"] == "Refund R-1 for 129.00 has been issued.", f"wrong answer: {result['answer']!r}"
assert result["steps"] == 3, f"the model was called 3 times, but steps is {result['steps']!r}"
assert len(result["messages"]) == len(expected), f"expected {len(expected)} messages, got {len(result['messages'])}"
for position, (actual, wanted) in enumerate(zip(result["messages"], expected)):
    assert actual == wanted, f"message {position} should be\n  {wanted}\nbut was\n  {actual}"

assert refunds == [("A-1042", 129.0)], f"issue_refund should have run once with the model's arguments, got {refunds}"
assert approvals == [("issue_refund", {"order_id": "A-1042", "amount": 129.0})], (
    f"approve should be asked once, with the tool name and the parsed arguments, got {approvals}"
)
assert [len(messages) for messages in model.seen] == [1, 3, 5], (
    f"each model call should receive the whole transcript so far; lengths were {[len(m) for m in model.seen]}"
)

# --- 2. The injected instruction: a registered tool that is not on the allow-list ----

model = ScriptedModel(
    [
        tool_call("c1", "lookup_order", {"order_id": "A-1042"}),
        tool_call("c2", "close_account", {"customer_id": "C-77"}),
        {"type": "final", "content": "I can't close accounts. Your order is marked as delivered."},
    ]
)
result = run_agent(model, TOOLS, TASK, allowed=ALLOWED, approve=approve)

print("status:", result["status"], "| steps:", result["steps"])
print("   blocked call ->", result["messages"][4] if len(result["messages"]) > 4 else None)

assert closed == [], "close_account is registered but not allowed, so it must never run"
assert result["messages"][4] == {
    "role": "tool",
    "tool_call_id": "c2",
    "ok": False,
    "content": "error: tool not allowed: close_account",
}, f"wrong result for a tool that is not on the allow-list: {result['messages'][4]}"
assert result["status"] == "completed" and result["steps"] == 3, "after one blocked call the run should continue to the final reply"
