"""Phishing simulation metrics, behavior risk scores and the managers' aggregate report."""
import pandas as pd


def flag(column):
    """True where the text is "yes" in any case, spaces ignored."""
    return column.astype(str).str.strip().str.lower().eq("yes")


def department_metrics(campaign_path):
    """Click, submit and report rates and the median minutes to report, per department."""
    df = pd.read_csv(campaign_path)
    for col in ["clicked", "submitted", "reported"]:
        df[col] = flag(df[col])
    df["report_minutes"] = df["minutes_to_report"].where(df["reported"])
    out = df.groupby("department").agg(
        sent=("user", "size"),
        click_rate=("clicked", "mean"),
        submit_rate=("submitted", "mean"),
        report_rate=("reported", "mean"),
        median_report_minutes=("report_minutes", "median"),
    )
    rates = ["click_rate", "submit_rate", "report_rate"]
    out[rates] = out[rates].round(2)
    return out.sort_index()


def risk_scores(people_path):
    """The behavior risk score of each person, highest first."""
    df = pd.read_csv(people_path)
    points = (
        30 * (df["submitted_90d"] >= 1)
        + 10 * (df["clicked_90d"] >= 1)
        - 15 * (df["reported_90d"] >= 1)
        + 15 * flag(df["training_overdue"])
        + 20 * flag(df["privileged"])
        + 15 * flag(df["handles_payments"])
        + (10 * df["dlp_events_90d"]).clip(upper=30)
    )
    out = pd.DataFrame({
        "user": df["user"],
        "department": df["department"],
        "score": points.clip(0, 100).astype(int),
    })
    out["targeted_training"] = out["score"] > 50
    out["phishing_resistant_mfa"] = out["score"] > 70
    return out.sort_values(["score", "user"], ascending=[False, True]).set_index("user")


def manager_report(scores):
    """Team aggregates only: people, mean score and how many need targeted training."""
    out = scores.groupby("department").agg(
        people=("score", "size"),
        mean_score=("score", "mean"),
        needs_training=("targeted_training", "sum"),
    )
    out["mean_score"] = out["mean_score"].round(1)
    out["needs_training"] = out["needs_training"].astype(int)
    return out.sort_index()
