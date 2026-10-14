# The car park example from the instructions. The guard keeps worker processes from rerunning it.
import threading

if __name__ == "__main__":
    a_ready, b_ready = threading.Event(), threading.Event()

    def gate_a():
        a_ready.set()
        return "A saw B" if b_ready.wait(2) else "A was alone"

    def gate_b():
        b_ready.set()
        return "B saw A" if a_ready.wait(2) else "B was alone"

    together = run_together([gate_a, gate_b])
    assert sorted(map(str, together)) == ["A saw B", "B saw A"], f"the two jobs should run at the same time, each seeing the other; got {together!r}"
    assert together == ["A saw B", "B saw A"], f"the results should be in the order of the jobs; got {together!r}"

    park = CarPark(2)
    assert [park.enter(p) for p in ["KL 1", "KL 2", "KL 3"]] == [True, True, False], "two spaces admit two cars and refuse the third"
    park.leave("KL 1")
    assert (park.free, park.parked) == (1, ["KL 2"]), "leaving frees the space and removes the plate"
    try:
        park.leave("XX 9")
    except ValueError:
        pass
    else:
        raise AssertionError("leaving with a plate that is not parked should raise ValueError")

    assert checksums(["abc", "", "Zoë"]) == [590, 0, 1017], "checksums gives the checksum of each text, in order"
