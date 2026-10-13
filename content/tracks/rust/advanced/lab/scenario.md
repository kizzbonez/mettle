Northgate Robotics signs every firmware release. Before signing, the release pipeline computes
a fingerprint for each build artifact and writes the fingerprints to a manifest, in the order
the artifacts were listed. Auditors compare that manifest from one release to the next, so the
order is part of the contract.

```text
bootloader.bin   9f2c41d0
kernel.img       03be77a9
rootfs.squashfs  c41e9a52
```

Fingerprinting is slow and a release has hundreds of artifacts. They are processed one at a
time on a build agent with eight cores. Last week someone "fixed" that by spawning one thread
per artifact. The agent hit its process limit halfway through and the release failed.

You are building the piece in between: a pool with a fixed number of worker threads. The
pipeline hands it work, gets the results back in the order it asked for them, and at the end of
the release shuts the pool down without losing anything that was still queued.
