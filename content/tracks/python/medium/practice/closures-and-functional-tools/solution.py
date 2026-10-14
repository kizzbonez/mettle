"""Bake Sale: cake stands, late-afternoon offers and the best sellers."""


def make_stand(stock):
    """Return sell(wanted=1), which sells up to wanted slices and returns how many it sold."""
    left = stock

    def sell(wanted=1):
        nonlocal left
        sold = min(wanted, left)
        left -= sold
        return sold

    return sell


def make_offers(percents):
    """Return one price function per percentage, each using its own percentage."""
    return [lambda price, percent=percent: round(price * (1 - percent / 100), 2) for percent in percents]


def best_sellers(sales, n):
    """The names of the n items sold most, highest first, ties alphabetically."""
    ranked = sorted(sales, key=lambda sale: (-sale["sold"], sale["item"]))
    return [sale["item"] for sale in ranked[:n]]
