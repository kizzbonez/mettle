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
    """A function the model may ask for. (Provided: do not change this class.)

    fn             called with the checked arguments as keywords
    params         every required argument name mapped to str, int, float or bool
    consequential  True if a person must approve each call before it runs
    """

    fn: Callable[..., Any]
    params: dict[str, type]
    consequential: bool = False


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

    A tool call is checked in this order, and the first failure becomes the
    tool result without the tool running: allow-list, arguments, approval.
    A tool that raises is reported to the model in the same way.
    """
    messages: list[Message] = [{"role": "user", "content": task}]

    # TODO 1: call the model, at most max_steps times, and stop on a "final" reply
    # TODO 2: for a "tool_call" reply, append the assistant message and one tool result
    # TODO 3: decide the result: allow-list, then arguments, then approval, then run the tool
    # TODO 4: stop after max_errors failed results in a row; a success resets the count
    raise NotImplementedError("run_agent is not implemented yet")
