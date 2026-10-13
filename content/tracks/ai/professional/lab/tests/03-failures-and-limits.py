import copy
import json


class ScriptedModel:
    """Replays a fixed list of replies and records the transcript it was shown each time."""

    def __init__(self, replies):
        self.replies = list(replies)
        self.seen = []

    def __call__(self, messages):
        self.seen.append(copy.deepcopy(messages))
        if not self.replies:
            return {"type": "final", "content": "(the script has no more replies)"}
        return self.replies.pop(0)


class LoopingModel:
    """Never finishes: asks for the same kind of tool call for as long as it is called."""

    def __init__(self, name, arguments):
        self.name, self.arguments, self.calls = name, arguments, 0

    def __call__(self, messages):
        self.calls += 1
        return {"type": "tool_call", "id": f"c{self.calls}", "name": self.name, "arguments": json.dumps(self.arguments)}


def tool_call(call_id, name, arguments):
    raw = arguments if isinstance(arguments, str) else json.dumps(arguments)
    return {"type": "tool_call", "id": call_id, "name": name, "arguments": raw}


FINAL = {"type": "final", "content": "Done."}
TASK = "Where is order A-1042?"
probes = []
outages = {"remaining": 0}


def probe(mode):
    probes.append(mode)
    if mode == "timeout":
        raise TimeoutError("order service timed out")
    if mode == "invalid":
        raise ValueError("amount exceeds the order total")
    return {"mode": mode}


def lookup_order(order_id):
    if outages["remaining"] > 0:
        outages["remaining"] -= 1
        raise TimeoutError("order service timed out")
    return {"order_id": order_id, "status": "in transit"}


TOOLS = {
    "probe": Tool(fn=probe, params={"mode": str}),
    "lookup_order": Tool(fn=lookup_order, params={"order_id": str}),
}
ALLOWED = {"probe", "lookup_order"}


def script(pattern):
    """Build replies from a pattern: "S" is a tool call that succeeds, "F" one that fails, "." the final reply."""
    modes = {"S": "fine", "F": "timeout"}
    return [FINAL if step == "." else tool_call(f"c{n}", "probe", {"mode": modes[step]}) for n, step in enumerate(pattern, 1)]


def run(model, **options):
    try:
        return run_agent(model, TOOLS, TASK, allowed=ALLOWED, **options)
    except Exception as error:
        raise AssertionError(f"run_agent raised {type(error).__name__} instead of reporting the problem to the model") from None


# --- A failing tool is an observation, and the model can recover ----------------------

outages["remaining"] = 2
lookup = {"order_id": "A-1042"}
model = ScriptedModel([tool_call("c1", "lookup_order", lookup), tool_call("c2", "lookup_order", lookup), tool_call("c3", "lookup_order", lookup), FINAL])
result = run(model)
timeout = "error: TimeoutError: order service timed out"
assert result["messages"][2] == {"role": "tool", "tool_call_id": "c1", "ok": False, "content": timeout}, (
    "a tool that raises should give a result of the form 'error: <exception class name>: <message>'"
)
assert model.seen[1][-1] == result["messages"][2], "the model should be shown a tool's error as the last message of its next call"
assert result["messages"][6] == {"role": "tool", "tool_call_id": "c3", "ok": True, "content": {"order_id": "A-1042", "status": "in transit"}}, (
    "after two failures, a third call that succeeds should give a normal result"
)
assert (result["status"], result["steps"], result["answer"]) == ("completed", 4, "Done."), (
    "two failures followed by a success should not stop the run when max_errors is 3"
)
assert model.seen[0] == [{"role": "user", "content": TASK}], "the first model call should receive only the user's task"
assert [len(messages) for messages in model.seen] == [1, 3, 5, 7], "each model call should receive the whole transcript so far"
assert result["messages"][-1] == {"role": "assistant", "content": "Done."}, "the transcript should end with the final reply"

result = run(ScriptedModel([tool_call("c1", "probe", {"mode": "invalid"}), FINAL]))
assert result["messages"][2]["content"] == "error: ValueError: amount exceeds the order total", (
    "the result for a failing tool should name the exception class and carry its message"
)

# --- The error limit counts failures in a row, of every kind --------------------------

model = ScriptedModel(script("FFSFFS."))
result = run(model, max_errors=3, max_steps=20)
assert (result["status"], result["steps"]) == ("completed", 7), "a successful tool call should reset the count of consecutive failures"

probes.clear()
model = ScriptedModel(script("FFFFFF."))
result = run(model, max_errors=3, max_steps=20)
assert result["status"] == "error_limit", "three failed tool calls in a row should stop the run with status 'error_limit'"
assert result["steps"] == 3 and len(model.seen) == 3, "the model should not be called again once the error limit is reached"
assert result["answer"] is None, "answer should be None when the run did not complete"
assert len(result["messages"]) == 7 and result["messages"][-1]["ok"] is False, (
    "the transcript should end with the failed result that reached the limit"
)
assert len(probes) == 3, "the failing tool should have been tried exactly three times"

mixed = [
    tool_call("m1", "close_account", {"customer_id": "C-77"}),
    tool_call("m2", "probe", "not json"),
    tool_call("m3", "probe", {"mode": "timeout"}),
    FINAL,
]
result = run(ScriptedModel(mixed), max_errors=3, max_steps=20)
assert result["status"] == "error_limit" and result["steps"] == 3, (
    "a disallowed tool, invalid arguments and a tool that raises should all count toward the error limit"
)

model = ScriptedModel(script("FFFFFF."))
result = run(model, max_steps=20)
assert (result["status"], result["steps"]) == ("error_limit", 3), "max_errors should default to 3"

model = ScriptedModel(script("F."))
result = run(model, max_errors=1)
assert (result["status"], result["steps"]) == ("error_limit", 1), "with max_errors=1 the first failure should stop the run"

# --- The step limit -------------------------------------------------------------------

probes.clear()
model = LoopingModel("probe", {"mode": "fine"})
result = run(model, max_steps=4)
assert result["status"] == "step_limit", "a model that never gives a final reply should be stopped with status 'step_limit'"
assert result["steps"] == 4 and model.calls == 4, "the model should be called exactly max_steps times"
assert result["answer"] is None, "answer should be None when the step limit stops the run"
assert len(probes) == 4, "the tool call made in the last step should still be processed"
assert len(result["messages"]) == 9 and result["messages"][-1]["role"] == "tool", (
    "the transcript should hold the task plus a call and a result for every step"
)

model = LoopingModel("probe", {"mode": "fine"})
result = run(model)
assert (result["status"], result["steps"], model.calls) == ("step_limit", 6, 6), "max_steps should default to 6"

model = ScriptedModel(script("SS."))
result = run(model, max_steps=3)
assert (result["status"], result["steps"]) == ("completed", 3), "a final reply in the last allowed step should complete the run"

model = ScriptedModel(script("SSS."))
result = run(model, max_steps=3)
assert (result["status"], result["steps"]) == ("step_limit", 3), "the run should stop at max_steps even if the next reply would have been final"
assert len(model.seen) == 3, "the model must not be called more than max_steps times"

model = ScriptedModel([FINAL])
result = run(model, max_steps=1)
assert (result["status"], result["steps"], len(result["messages"])) == ("completed", 1, 2), (
    "a model that answers immediately should complete in one step with a two-message transcript"
)
