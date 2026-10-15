"""Phishing simulation metrics, behavior risk scores and the managers' aggregate report."""
import pandas as pd


def department_metrics(campaign_path):
    """Click, submit and report rates and the median minutes to report, per department."""
    # YOUR CODE: flags from yes/no text, then groupby("department").agg(...);
    # the median uses only the minutes of people who reported.
    raise NotImplementedError


def risk_scores(people_path):
    """The behavior risk score of each person, highest first."""
    # YOUR CODE: add the points of the table, DLP at most 30, keep the total between 0 and 100,
    # then targeted_training (> 50) and phishing_resistant_mfa (> 70); sort and index by user.
    raise NotImplementedError


def manager_report(scores):
    """Team aggregates only: people, mean score and how many need targeted training."""
    # YOUR CODE
    raise NotImplementedError
