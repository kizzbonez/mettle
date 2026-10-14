# run_together: one thread per job, all at once, results in the order of the jobs.
import threading

assert run_together([]) == [], "no jobs give an empty list"
assert run_together([lambda: "only"]) == ["only"], "a single job's result comes back in a list"
assert run_together([lambda: None, lambda: 0]) == [None, 0], "results such as None and 0 are kept as they are"

# Eight jobs meet at a barrier, which only opens when all eight are waiting at once.
# Then each job finishes only after the next one, so the last job finishes first.
count = 8
barrier = threading.Barrier(count, timeout=2)
finished = [threading.Event() for _ in range(count + 1)]
finished[count].set()
calls = []


def make_job(i):
    def job():
        calls.append(i)
        try:
            barrier.wait()
        except threading.BrokenBarrierError:
            return f"job {i} ran without the others"
        finished[i + 1].wait(2)
        finished[i].set()
        return i * 10

    return job


try:
    result = run_together([make_job(i) for i in range(count)])
except Exception as error:
    raise AssertionError(f"run_together should not fail when the jobs succeed; it raised {error!r}")
assert all(isinstance(r, int) for r in result), "all eight jobs should run at the same time, one thread per job"
assert result == [i * 10 for i in range(count)], "results come in the order of the jobs, not the order they finished"
assert sorted(calls) == list(range(count)), "each job runs exactly once"
assert threading.active_count() == 1, "every thread has finished when run_together returns"
