"""Ashby charging report: clean the chargers' session exports and summarise them per site."""

import pandas as pd

SITE_CODES = {"mkt": "MKT", "stn": "STN", "lei": "LEI", "hsp": "HSP"}


def load_sessions(path):
    sessions = pd.read_csv(path, skiprows=1, na_values=["-"], parse_dates=["started"])
    sessions["site"] = sessions["site"].replace(SITE_CODES)
    sessions["connector"] = sessions["connector"].astype("category")
    sessions["minutes"] = pd.to_numeric(sessions["minutes"], errors="coerce").astype("Int64")
    return sessions


def load_prices(path):
    sites = pd.read_json(path)
    return sites.set_index("code")["price_per_kwh"]


def add_cost(sessions, prices):
    price = sessions["site"].map(prices)
    with_cost = sessions.assign(cost=(sessions["kwh"] * price).round(2))
    with_cost.loc[with_cost["status"] == "fault", "cost"] = 0.0
    return with_cost


def completed_in_period(sessions, start, end):
    keep = (sessions["status"] == "ok") & sessions["started"].between(start, end)
    return sessions[keep].reset_index(drop=True)


def site_summary(sessions):
    marked = sessions.assign(fault=pd.col("status") == "fault")
    summary = marked.groupby("site", as_index=False).agg(
        sessions=("session_id", "size"),
        energy_kwh=("kwh", "sum"),
        revenue=("cost", "sum"),
        avg_minutes=("minutes", "mean"),
        faults=("fault", "sum"),
    )
    summary["energy_kwh"] = summary["energy_kwh"].round(1)
    summary["revenue"] = summary["revenue"].round(2)
    summary["avg_minutes"] = summary["avg_minutes"].round(1)
    summary = summary.sort_values(["revenue", "energy_kwh", "site"], ascending=[False, False, True])
    return summary.reset_index(drop=True)
