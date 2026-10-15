# Card masks, and quasi-identifier groups smaller than k.
def row(card="", postcode="BS1 4DJ", birth_date="1990-01-01", customer_id="C-5"):
    return {"customer_id": customer_id, "full_name": "Test Person", "email": "t@mail.example", "phone": "07700 900000",
            "postcode": postcode, "birth_date": birth_date, "card_number": card, "plan": "fibre-100",
            "monthly_spend": "30.00", "research_consent": "yes", "notes": ""}


cards = {
    "4111-1111-1111-1111": "************1111",
    " 4111 1111 1111 1111 ": "************1111",
    "3782 822463 10005": "***********0005",
    "6011000990139424": "************9424",
    "": "",
}
for card, masked in cards.items():
    got = protect([row(card=card)], b"k")[0]["card"]
    assert got == masked, f"card for the card number {card!r}"

people = [
    ("BS2 1AA", "1990-05-05"), ("BS10 7QQ", "1990-05-05"), ("BS10 7QQ", "1991-05-05"),
    ("BS2 1AA", "1960-05-05"), ("BS2 1AA", "1961-05-05"), ("BS2 1AA", "1962-05-05"),
    ("BS10 7QQ", "1955-05-05"), ("BS2 9ZZ", "1990-01-01"),
]
records = protect([row(postcode=p, birth_date=b, customer_id=f"C-{n}") for n, (p, b) in enumerate(people)], b"k")
got = small_groups(records, 3)
assert got == [("BS10", "30-39", 2), ("BS10", "70-79", 1), ("BS2", "30-39", 2)], (
    "small_groups(records, 3): groups below k, sorted by area then age band as text"
)
assert small_groups(records, 1) == [], "small_groups with k = 1 finds nothing"
assert small_groups(records, 4) == [("BS10", "30-39", 2), ("BS10", "70-79", 1), ("BS2", "30-39", 2), ("BS2", "60-69", 3)], (
    "small_groups(records, 4): a group of exactly 3 is below 4"
)
assert small_groups([], 5) == [], "small_groups of no records"
