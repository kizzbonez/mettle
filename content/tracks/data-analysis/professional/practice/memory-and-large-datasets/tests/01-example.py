import pandas as pd

real_read_csv = pd.read_csv
scans = real_read_csv("data/scans.csv")
before = scans.copy()

small = shrink(scans)
check_frame(
    small,
    scans.astype({"store": "category", "till": "int8", "price_pence": "int16", "quantity": "int8"}).assign(
        scanned_at=pd.to_datetime(scans["scanned_at"], format="%Y-%m-%d %H:%M:%S")
    ),
    "shrink gives the sample the smaller types with the same values",
)
check_frame(scans, before, "shrink does not change the frame it is given")

takings = read_takings("data/scans.csv")
check_frame(
    takings,
    real_read_csv("data/scans.csv", usecols=["store", "price_pence", "quantity"]).astype(
        {"store": "category", "price_pence": "int32", "quantity": "int8"}
    ),
    "read_takings reads the sample's three columns with the stated types",
)


class CountingReader:
    """Hands out the chunks of a real reader and records how many rows each one had."""

    def __init__(self, reader):
        self.reader = reader
        self.sizes = []

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        self.reader.close()

    def __iter__(self):
        return self

    def __next__(self):
        chunk = next(self.reader)
        self.sizes.append(len(chunk))
        return chunk

    def get_chunk(self, size=None):
        chunk = self.reader.get_chunk(size)
        self.sizes.append(len(chunk))
        return chunk

    def close(self):
        self.reader.close()


readers = []


def counting_read_csv(*args, **kwargs):
    result = real_read_csv(*args, **kwargs)
    if kwargs.get("chunksize"):
        result = CountingReader(result)
    readers.append((kwargs, result))
    return result


pd.read_csv = counting_read_csv
try:
    totals = store_totals("data/scans.csv", 5)
finally:
    pd.read_csv = real_read_csv

assert readers, "store_totals reads the file with pd.read_csv"
assert all(kwargs.get("chunksize") == 5 for kwargs, _ in readers), "store_totals reads the file in chunks of chunksize rows"
assert readers[0][1].sizes == [5, 5, 5, 1], "store_totals reads the 16 sample rows as chunks of 5, 5, 5 and 1"
check_frame(
    totals.set_axis(totals.index.astype("str")),
    pd.DataFrame(
        {"items": [19, 32, 15], "takings_pence": [9236, 27378, 24038], "mean_price_pence": [486.11, 855.56, 1602.53]},
        index=pd.Index(["Ashford", "Bexley", "Carlton"], name="store"),
    ),
    "store_totals gives the sample's items, takings and mean price per store",
)
