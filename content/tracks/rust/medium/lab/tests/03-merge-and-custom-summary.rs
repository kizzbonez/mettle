// Two hosts report separately; the dashboard needs one view.
let host_a = [("/cart", 10), ("/cart", 20), ("/cart", 30), ("/pay", 400)];
let host_b = [("/cart", 100), ("/cart", 200), ("/login", 7), ("/login", 9)];

let mut mean: Rollup<&str, Mean> = host_a.iter().copied().collect();
let mean_b: Rollup<&str, Mean> = host_b.iter().copied().collect();
mean.merge(&mean_b);

assert!(
    mean.get(&"/cart") == Some(72),
    "a merged Mean equals the mean of all samples from both hosts, not the mean of the two means"
);
assert!(
    mean.report() == vec![("/cart", 72), ("/login", 8), ("/pay", 400)],
    "after a merge the report has the keys of both roll-ups, including keys only one of them had"
);
assert!(
    mean_b.report() == vec![("/cart", 150), ("/login", 8)],
    "merge does not modify the roll-up that was merged in"
);

let mut count: Rollup<&str, Count> = host_a.iter().copied().collect();
count.merge(&host_b.iter().copied().collect());
assert!(
    count.top(2) == vec![("/cart", 5), ("/login", 2)],
    "merged counts add up per key"
);

let mut max: Rollup<&str, Max> = host_b.iter().copied().collect();
max.merge(&host_a.iter().copied().collect());
assert!(
    max.report() == vec![("/cart", 200), ("/login", 9), ("/pay", 400)],
    "merged maxima keep the larger value per key"
);

// Merging an empty roll-up, in either direction, changes nothing.
let nothing: Rollup<&str, Mean> = Rollup::new();
let before = mean.report();
mean.merge(&nothing);
assert!(mean.report() == before, "merging an empty roll-up changes nothing");
let mut fresh: Rollup<&str, Mean> = Rollup::new();
fresh.merge(&mean);
assert!(fresh.report() == before, "merging into an empty roll-up copies every key");

// A statistic the component has never heard of: the gap between the fastest
// and the slowest sample.
#[derive(Default)]
struct Spread {
    bounds: Option<(u64, u64)>,
}

impl Summary for Spread {
    fn record(&mut self, sample: u64) {
        self.bounds = Some(match self.bounds {
            Some((low, high)) => (low.min(sample), high.max(sample)),
            None => (sample, sample),
        });
    }

    fn merge(&mut self, other: &Self) {
        if let Some((low, high)) = other.bounds {
            self.record(low);
            self.record(high);
        }
    }

    fn value(&self) -> Option<u64> {
        self.bounds.map(|(low, high)| high - low)
    }
}

let mut spread: Rollup<&str, Spread> = host_a.iter().copied().collect();
assert!(
    spread.report() == vec![("/cart", 20), ("/pay", 0)],
    "Rollup works with a Summary defined outside the solution"
);
spread.merge(&host_b.iter().copied().collect());
assert!(
    spread.top(3) == vec![("/cart", 190), ("/login", 2), ("/pay", 0)],
    "Rollup::merge combines summaries through Summary::merge, so a custom summary merges correctly"
);
