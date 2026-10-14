# leave refuses unknown plates; checksums runs checksum in other processes. Guarded for the workers.
import functools
import sys

if __name__ == "__main__":
    park = CarPark(2)
    park.enter("AB 1")
    park.enter("CD 2")
    try:
        park.leave("ZZ 0")
    except ValueError:
        pass
    else:
        raise AssertionError("leaving with a plate that is not parked should raise ValueError")
    assert park.parked == ["AB 1", "CD 2"] and park.free == 0, "a refused leave changes nothing"
    park.leave("AB 1")
    assert park.enter("EF 3") is True and park.parked == ["CD 2", "EF 3"], "a freed space can be taken again, and parked keeps entry order"
    park.leave("CD 2")
    try:
        park.leave("CD 2")
    except ValueError:
        pass
    else:
        raise AssertionError("leaving twice with the same plate should raise ValueError the second time")
    assert park.free == 1, "a refused second leave frees nothing"

    # Count the calls to checksum made in this process: with a process pool there are none.
    module = sys.modules["solution"]
    original = module.checksum
    here = []

    @functools.wraps(original)
    def counted(text):
        here.append(text)
        return original(text)

    texts = ["KL 1 08:02", "KL 2 08:15", "", "Ærø 7 23:59", "x" * 2000, "KL 1 18:40"]
    module.checksum = counted
    try:
        result = checksums(texts)
    finally:
        module.checksum = original
    assert result == [original(text) for text in texts], "checksums gives the checksum of each text, in order"
    assert here == [], "checksum should run in the worker processes of a ProcessPoolExecutor, not in this process"
    assert checksums([]) == [], "no texts give an empty list"
