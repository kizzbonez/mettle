// The fingerprint used in this lab: 32-bit FNV-1a over the artifact name.
fn fingerprint(artifact: &str) -> u32 {
    let mut hash: u32 = 0x811c_9dc5;
    for byte in artifact.bytes() {
        hash ^= u32::from(byte);
        hash = hash.wrapping_mul(0x0100_0193);
    }
    hash
}

let pool = WorkerPool::new(4).expect("a pool of four workers can be created");
assert_eq!(pool.size(), 4, "size() reports the number of workers");

// The example from the instructions.
let lengths = pool.map(vec!["bootloader.bin", "kernel.img", "rootfs.squashfs"], |name| name.len());
assert_eq!(lengths, vec![14, 10, 15], "one output per input, in input order");

// A release manifest: the pool must agree with doing the work one by one.
let artifacts = vec![
    "bootloader.bin",
    "kernel.img",
    "rootfs.squashfs",
    "app.tar",
    "manifest.json",
    "licenses.txt",
];
let expected: Vec<u32> = artifacts.iter().map(|name| fingerprint(name)).collect();
let fingerprints = pool.map(artifacts, fingerprint);
assert_eq!(fingerprints, expected, "fingerprints in manifest order");

assert_eq!(pool.shutdown(), 9, "shutdown returns the number of jobs the pool ran");
