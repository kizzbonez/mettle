# annual_loss: the window edges, another as_of and years, unknown risk ids, the industry ARO and rounding.
from pathlib import Path

import pandas as pd

COLUMNS = ["title", "owner", "host", "asset_value", "exposure_factor", "sle", "events", "aro", "ale"]

Path("assets-x.csv").write_text(
    "host,ip,role,owner,criticality,exposure,asset_value_usd\n"
    "ferry-ops,10.1.0.4,sailing operations,Marine,critical,internal,200000\n"
    " Tickets-1 ,10.1.0.7,ticket database,Sales,high,internal,50000\n",
    encoding="utf-8",
)
Path("risks-x.csv").write_text(
    "risk_id,title,host,exposure_factor,industry_aro,owner\n"
    "X2,Ticket fraud,TICKETS-1,0.10,0.25,Owner B\n"
    "X1,Sailing operations outage,ferry-ops,0.25,0.40,Owner A\n"
    "X3,Ticket database leak,tickets-1,0.50,0.02,Owner C\n",
    encoding="utf-8",
)
Path("losses-x.csv").write_text(
    "incident_id,date,risk_id,description,loss_usd\n"
    "L1,2021-12-31,X1,one day before the window,100\n"
    "L2,2022-01-01,X1,first day of the window,100\n"
    "L3,2023-06-15,X1,inside,100\n"
    "L4,2024-12-31,X1,last day of the window,100\n"
    "L5,2025-01-01,X1,as_of itself,100\n"
    "L6,2023-03-03,X2,inside,100\n"
    "L7,2023-04-04,X9,not a stated risk,100\n",
    encoding="utf-8",
)

table = annual_loss("risks-x.csv", "losses-x.csv", "assets-x.csv", "2025-01-01", years=3)
assert list(table.columns) == COLUMNS, f"annual_loss has the columns of step 4, in order (got {list(table.columns)})"
expected = pd.DataFrame(
    {
        "title": ["Sailing operations outage", "Ticket fraud", "Ticket database leak"],
        "owner": ["Owner A", "Owner B", "Owner C"],
        "host": ["ferry-ops", "tickets-1", "tickets-1"],
        "asset_value": [200000, 50000, 50000],
        "exposure_factor": [0.25, 0.10, 0.50],
        "sle": [50000.0, 5000.0, 25000.0],
        "events": [3, 1, 0],
        "aro": [1.0, 1 / 3, 0.02],
        "ale": [50000.0, 1666.67, 500.0],
    },
    index=pd.Index(["X1", "X2", "X3"], name="risk_id"),
)
check_frame(
    table,
    expected,
    "annual_loss counts incidents from as_of minus years up to the day before as_of, ignores unknown risk ids, "
    "uses the industry ARO when a risk has no events, matches clean host names, rounds SLE and ALE to 2 decimals "
    "and sorts by risk_id",
    check_dtype=False,
    atol=0.005,
)
assert str(table["events"].dtype).startswith("int"), "events is an integer column"

october = annual_loss("data/risks.csv", "data/losses.csv", "data/assets.csv", "2026-10-16")
events = october["events"].to_dict()
assert (events["R05"], events["R06"], events["R07"]) == (4, 2, 3), (
    "with the default five years, an incident on 2021-10-16 counts, one on 2021-10-15 does not, "
    "one on 2026-10-15 counts and one dated on as_of does not"
)
assert abs(october.loc["R03", "ale"] - 15000.0) < 0.01, "R03 uses its one VPN incident: ARO 0.2"
