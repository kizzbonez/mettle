"""Museum Visitors: the weekly visitor report, with checks against last week."""

from pathlib import Path

import pandas as pd


def visitor_table(visits):
    """Visitors per museum and ticket type, with a Total row and a Total column."""
    return visits.pivot_table(
        index="museum",
        columns="ticket",
        values="visitors",
        aggfunc="sum",
        fill_value=0,
        margins=True,
        margins_name="Total",
    )


def render(table):
    """The table as text: counts with thousands separators and each museum's share of the total."""
    shared = table.assign(share=table["Total"] / table.loc["Total", "Total"])
    count = "{:,.0f}".format
    formatters = {column: count for column in table.columns}
    formatters["share"] = "{:.1%}".format
    return shared.to_string(formatters=formatters)


def batch_warnings(previous, current, max_change=0.2, max_null_rise=0.05):
    """Compare this week's visits with last week's and return a list of warnings."""
    warnings = []
    change = len(current) / len(previous) - 1
    if abs(change) > max_change:
        warnings.append(f"row count {len(previous)} -> {len(current)} ({change:+.0%})")
    rise = current.isna().mean() - previous.isna().mean()
    for column in current.columns:
        if rise[column] > max_null_rise:
            warnings.append(f"{column}: missing values up {rise[column]:.0%}")
    now = set(current["museum"].dropna())
    before = set(previous["museum"].dropna())
    if now - before:
        warnings.append(f"museum: new value(s) {', '.join(sorted(now - before))}")
    if before - now:
        warnings.append(f"museum: missing value(s) {', '.join(sorted(before - now))}")
    return warnings


def write_report(path, previous, current):
    """Write the week's table and the data checks to PATH as UTF-8 text."""
    checks = batch_warnings(previous, current) or ["none"]
    lines = [
        f"Museum visitors, {current['day'].min():%Y-%m-%d} to {current['day'].max():%Y-%m-%d}",
        "",
        render(visitor_table(current)),
        "",
        "Data checks:",
        *[f"  - {check}" for check in checks],
    ]
    Path(path).write_text("\n".join(lines) + "\n", encoding="utf-8")
