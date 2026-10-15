# Postcodes to outward codes and birth dates to ten-year bands on REFERENCE_DATE (2026-12-01).
def row(postcode="BS1 4DJ", birth_date="1990-01-01"):
    return {"customer_id": "C-9", "full_name": "Test Person", "email": "t@mail.example", "phone": "07700 900000",
            "postcode": postcode, "birth_date": birth_date, "card_number": "", "plan": "mobile-10",
            "monthly_spend": "10.00", "research_consent": "yes", "notes": ""}


postcodes = {"sw1a 1aa": "SW1A", "M1 1AE": "M1", "EC1A1BB": "EC1A", " n1  9gu ": "N1", "B33 8TH": "B33", "cr2 6xh": "CR2"}
for postcode, area in postcodes.items():
    got = protect([row(postcode=postcode)], b"k")[0]["area"]
    assert got == area, f"area for the postcode {postcode!r}"

births = {
    "1996-12-01": "30-39",   # 30 on the reference date itself
    "1996-12-02": "20-29",   # turns 30 the next day
    "1997-01-15": "20-29",
    "2000-02-29": "20-29",   # born on a leap day
    "2026-06-01": "0-9",
    "2017-12-01": "0-9",     # 9
    "2016-12-01": "10-19",   # 10
    "1936-12-02": "80-89",   # 89, a day before turning 90
    "1936-12-01": "90+",     # exactly 90
    "1925-05-05": "90+",
}
for born, band in births.items():
    got = protect([row(birth_date=born)], b"k")[0]["age_band"]
    assert got == band, f"age_band for someone born on {born}"
