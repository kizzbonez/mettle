# red_flags(): whose Authentication-Results to trust, failure results, Reply-To and the subject.
def message(auth_headers, reply_to=None, subject="Delivery schedule"):
    lines = [f"Authentication-Results: {value}" for value in auth_headers]
    lines.append("From: Logistics <logistics@supplier.example>")
    if reply_to:
        lines.append(f"Reply-To: {reply_to}")
    lines += ["To: site@brightwell-build.example", f"Subject: {subject}", "", "Body."]
    return "\n".join(lines) + "\n"


ours_pass = "mx1.brightwell-build.example; spf=pass smtp.mailfrom=supplier.example; dkim=pass header.d=supplier.example; dmarc=pass"
cases = [
    ([ours_pass], None, "Delivery schedule", [], "a clean message"),
    (["MX1.Brightwell-Build.Example;\n spf=softfail smtp.mailfrom=supplier.example;\n dkim=pass;\n dmarc=pass"], None,
     "Delivery schedule", ["auth-fail"], "spf=softfail from our gateway, folded over lines, gateway name in mixed case"),
    (["mx1.brightwell-build.example; spf=pass; dkim=neutral; dmarc=pass"], None, "Delivery schedule", [],
     "dkim=neutral is not one of the failures"),
    (["mx1.brightwell-build.example; spf=pass; DKIM=None; dmarc=pass"], None, "Delivery schedule", ["auth-fail"],
     "DKIM=None in upper case"),
    (["mx.supplier.example; spf=fail; dkim=fail; dmarc=fail", ours_pass], None, "Delivery schedule", [],
     "failures in a header the sender added are ignored"),
    (["relay.brightwell-build.example; dmarc=fail", ours_pass], None, "Delivery schedule", [],
     "only the header of GATEWAY counts, not any server of ours"),
    ([], None, "Delivery schedule", [], "a message without Authentication-Results"),
    ([ours_pass], "Credit Control <credit@SUPPLIER.example>", "Delivery schedule", [],
     "a Reply-To in the same domain, in another case"),
    ([ours_pass], "Logistics <logistics.desk@freemail.example>", "Delivery schedule", ["reply-to"],
     "a Reply-To with a display name, in another domain"),
    ([ours_pass], None, "Payment needed ASAP", ["urgency"], "ASAP in upper case in the subject"),
    ([ours_pass], None, "Re: FINAL NOTICE for unpaid crane hire", ["urgency"], "a two-word phrase in upper case"),
    ([ours_pass], None, "Final schedule for the pour", [], "final without notice is not urgent"),
]
for headers, reply_to, subject, expected, what in cases:
    got = red_flags(message(headers, reply_to, subject))
    assert got == expected, f"red_flags: {what}"
