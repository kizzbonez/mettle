"""The agent loop for the Parcel & Pine refund desk.

The model is any callable that takes the transcript (a list of message dicts)
and returns one reply:

    {"type": "tool_call", "id": "c1", "name": "lookup_order", "arguments": '{"order_id": "A-1042"}'}
    {"type": "final", "content": "Refund R-1 has been issued."}

Nothing the model says is trusted. Every rule that matters is enforced here.
"""

import json
from collections.abc import Callable, Collection
from dataclasses import dataclass
from typing import Any

Message = dict[str, Any]
Model = Callable[[list[Message]], dict[str, Any]]
Approver = Callable[[str, dict[str, Any]], bool]


@dataclass(frozen=True)
class Tool:
    """A function the model may ask for.

    fn             called with the checked arguments as keywords
    params         every required argument name mapped to str, int, float or bool
    consequential  True if a person must approve each call before it runs
    """

    fn: Callable[..., Any]
    params: dict[str, type]
    consequential: bool = False


class _Refused(Exception):
    """A tool call that must not run. Its text becomes the model's observation."""


def _has_type(value: Any, expected: type) -> bool:
    """Type check for JSON values: an int is a valid float, and a bool is never a number."""
    if isinstance(value, bool):
        return expected is bool
    if expected is float:
        return isinstance(value, (int, float))
    return isinstance(value, expected)


def _parse_arguments(raw: Any, params: dict[str, type]) -> dict[str, Any]:
    """Return the arguments as a dict, or raise ``_Refused`` if they do not fit ``params``."""
    try:
        args = json.loads(raw)
    except (TypeError, ValueError):
        raise _Refused("invalid arguments: not valid JSON") from None
    if not isinstance(args, dict):
        raise _Refused("invalid arguments: expected a JSON object")
    if set(args) != set(params):
        raise _Refused(f"invalid arguments: expected exactly the fields {sorted(params)}")
    for name, expected in params.items():
        if not _has_type(args[name], expected):
            raise _Refused(f"invalid arguments: {name} must be of type {expected.__name__}")
    return args


def _observe(
    name: str,
    raw_arguments: Any,
    tools: dict[str, Tool],
    allowed: Collection[str],
    approve: Approver | None,
) -> tuple[bool, Any]:
    """Check one tool call and run it only if every check passes. Returns ``(ok, content)``."""
    try:
        if name not in allowed or name not in tools:
            raise _Refused(f"tool not allowed: {name}")
        tool = tools[name]
        args = _parse_arguments(raw_arguments, tool.params)
        if tool.consequential and (approve is None or approve(name, args) is not True):
            raise _Refused("approval denied")
    except _Refused as refusal:
        return False, f"error: {refusal}"
    try:
        return True, tool.fn(**args)
    except Exception as error:  # a failing tool is an observation for the model, not a crash
        return False, f"error: {type(error).__name__}: {error}"


def run_agent(
    model: Model,
    tools: dict[str, Tool],
    task: str,
    *,
    allowed: Collection[str],
    approve: Approver | None = None,
    max_steps: int = 6,
    max_errors: int = 3,
) -> dict[str, Any]:
    """Drive ``model`` until it answers or a limit stops the run.

    Returns ``{"status", "answer", "steps", "messages"}``. ``status`` is
    ``"completed"``, ``"error_limit"`` or ``"step_limit"``; ``answer`` is the
    final text or ``None``; ``steps`` counts model calls; ``messages`` is the
    whole transcript.
    """
    messages: list[Message] = [{"role": "user", "content": task}]
    steps = 0
    consecutive_errors = 0

    def finish(status: str, answer: str | None = None) -> dict[str, Any]:
        return {"status": status, "answer": answer, "steps": steps, "messages": messages}

    while steps < max_steps:
        reply = model(messages)
        steps += 1

        if reply["type"] == "final":
            messages.append({"role": "assistant", "content": reply["content"]})
            return finish("completed", reply["content"])

        call = {"id": reply["id"], "name": reply["name"], "arguments": reply["arguments"]}
        messages.append({"role": "assistant", "tool_call": call})
        ok, content = _observe(call["name"], call["arguments"], tools, allowed, approve)
        messages.append({"role": "tool", "tool_call_id": call["id"], "ok": ok, "content": content})

        consecutive_errors = 0 if ok else consecutive_errors + 1
        if consecutive_errors >= max_errors:
            return finish("error_limit")

    return finish("step_limit")
