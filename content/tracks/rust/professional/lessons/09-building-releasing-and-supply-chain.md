---
title: Building, Releasing and Supply Chain
summary: Tune the release profile, shrink and cross-compile binaries, organise a large codebase with workspaces and features, and know exactly what code you ship.
minutes: 30
objectives:
  - Configure a release profile and state the trade-off of `lto`, `codegen-units`, `panic` and `strip`
  - Cross-compile for another target and say what is needed besides the Rust standard library
  - Structure a workspace with shared settings and additive feature flags
  - Audit dependencies and take the main steps towards a reproducible build
---

## Outline

1. Release profiles and binary size
2. Cross-compilation
3. Workspaces
4. Feature flags
5. Supply chain
6. Reproducible builds

## Release profiles and binary size

A **profile** is a named set of compiler settings. `cargo build` uses `dev`: no
optimization, full debug information, fast builds. `cargo build --release` uses `release`,
whose defaults are `opt-level = 3`, `debug = false`, `lto = false`, `codegen-units = 16`,
`panic = "unwind"` and `strip = "none"`. You can change them, and add profiles of your own:

```toml
[profile.release]
codegen-units = 1
lto = "thin"

[profile.dist]            # cargo build --profile dist, output in target/dist/
inherits = "release"
opt-level = "z"
lto = "fat"
panic = "abort"
strip = "symbols"
```

- **`codegen-units`**: the compiler splits each crate into units that it optimizes in
  parallel. Fewer units means better optimization and a slower build.
- **`lto`** (link-time optimization) optimizes across crate boundaries. `"thin"` is the
  cheaper form, and `"fat"` (or `true`) treats the whole program as one unit and builds
  slowest. The default `false` still applies thin LTO inside each crate.
- **`panic = "abort"`** drops the unwinding machinery. `catch_unwind` stops working and
  destructors do not run after a panic.
- **`strip`** removes symbols. Backtraces lose their function names, so keep an unstripped
  copy to decode crash reports.
- **`opt-level = "s"`** or **`"z"`** optimizes for size at some cost in speed.

Profiles are read only from the manifest at the workspace root. A dependency's own profile
settings are ignored.

A "hello world" built in this course's sandbox (x86-64 Linux) shows the effect on size:

```text
profile                                              bytes
dev                                              4,545,256
release                                            444,728
release with strip = true                          336,784
"z", fat LTO, one unit, abort, strip                281,280
```

Your numbers will differ, but the order rarely does: leaving `dev` and stripping are the
large steps.

## Cross-compilation

A **target triple** such as `aarch64-unknown-linux-musl` names the architecture, vendor,
operating system and ABI you build for. `rustc` can already generate code for every target.
What it lacks is that target's standard library and a linker:

```bash
rustup target add aarch64-unknown-linux-musl
cargo build --release --target aarch64-unknown-linux-musl
```

Without the first command the build stops with error E0463, "can't find crate for `std`",
and a hint to run it. The output lands in `target/aarch64-unknown-linux-musl/release/`.
`rustup` installs only the Rust standard library. The linker, and the C libraries of any
dependency that wraps C code, come from a cross toolchain that you install and name in
`.cargo/config.toml`:

```toml
[target.aarch64-unknown-linux-musl]
linker = "aarch64-linux-musl-gcc"
```

Targets come in tiers. Tier 1 is "guaranteed to work": the Rust project builds and tests it
on every change. Tier 2 is "guaranteed to build". Tier 3 has no guarantees. Several `musl`
targets, such as `x86_64-unknown-linux-musl`, link the C library statically by default,
which gives one self-contained file that suits minimal containers.

## Workspaces

A **workspace** is a set of packages managed together. They share one `Cargo.lock` and one
`target` directory, so a dependency is resolved to one version and compiled once.

```toml
# Cargo.toml at the root. No [package]: this is a virtual manifest.
[workspace]
members = ["crates/*"]
resolver = "3"

[workspace.package]
edition = "2024"
rust-version = "1.85"

[workspace.dependencies]
codec = { path = "crates/codec" }

[workspace.lints.rust]
unsafe_code = "forbid"
```

A member opts in to each shared value:

```toml
# crates/api/Cargo.toml
[package]
name = "api"
version = "0.3.0"
edition.workspace = true
rust-version.workspace = true

[dependencies]
codec = { workspace = true, features = ["json"] }

[lints]
workspace = true
```

Splitting a codebase into crates pays in build time: a crate is the unit of compilation, so
a change recompiles that crate and its dependents only. The price is that every crate
boundary is an interface to maintain.

## Feature flags

A **feature** is a named switch that turns on optional code and optional dependencies.

```toml
[features]
default = []
json = ["dep:jsonlib"]        # enabling the feature enables the optional dependency
metrics = []

[dependencies]
jsonlib = { path = "../jsonlib", optional = true }
```

```rust
/// Compiled only when the `json` feature is on.
#[cfg(feature = "json")]
pub fn to_json(value: u32) -> String {
    format!("{{\"value\":{value}}}")
}

pub fn build_info() -> String {
    format!("json={} debug_assertions={}", cfg!(feature = "json"), cfg!(debug_assertions))
}

fn main() {
    println!("{}", build_info());
    #[cfg(feature = "json")]
    println!("{}", to_json(3));
}
```

```text
json=false debug_assertions=true
```

That is the output of a plain build. With the feature on and optimization enabled, the same
file prints `json=true debug_assertions=false` followed by `{"value":3}`.

Cargo builds each dependency once, with the **union** of the features that all its
dependents request. This is **feature unification**. In a test workspace where one crate
asked for `json` and another for `metrics`, both saw a `codec` with both features on. So a
feature must be **additive**: it may add items, never remove or change them, because some
unrelated crate may switch it on. A `no_std` feature that removes functionality is the
classic mistake. Offer a `std` feature that adds it. Test at least
`--no-default-features` and `--all-features` in CI.

## Supply chain

Every dependency is code you ship without having written it.

```bash
cargo build --release --locked   # fail if Cargo.lock would have to change
cargo audit                      # known vulnerabilities, from the RustSec database
cargo deny check                 # advisories, licenses, banned crates, allowed sources
cargo tree -d                    # dependencies present in more than one version
```

- **Commit `Cargo.lock`** and pass `--locked` in CI and release builds. The lock file pins
  the exact version of every dependency, and `--locked` turns silent drift into an error.
- **`cargo audit`** and **`cargo deny`** are separate tools installed with `cargo install`.
  Run them on a schedule as well as on changes, because advisories appear for code you have
  not touched.
- **`cargo vendor`** copies every dependency's source into the repository, for builds that
  must work offline or be reviewed line by line.
- **Depend on less.** Each crate removed is one less thing to audit and update.

## Reproducible builds

A build is **reproducible** if the same source always produces the same bytes, which lets
anyone check that a published binary matches its source. Rust does not promise this by
default. Compiling one file in the sandbox from two different directories:

```text
same directory, built twice           identical
directories /work/a and /work/b       different
both with --remap-path-prefix         identical
```

The difference was the source path embedded in panic messages. The steps that matter: pin
the toolchain with `rust-toolchain.toml`, build with `--locked`, keep target, profile and
flags the same, and remap paths with `--remap-path-prefix` (Cargo's `trim-paths` profile
setting, which automates this, is still unstable). Build scripts that embed a timestamp
break reproducibility again.

## Common mistakes

- **Shipping or benchmarking a `dev` build.**
- **`panic = "abort"` in a program that relies on `catch_unwind`** or on destructors running
  after a panic.
- **Stripping without keeping the symbols.** Crash reports become unreadable.
- **Features that exclude each other.** Unification will switch both on in someone's build.
- **`Cargo.lock` not committed for an application**, or CI without `--locked`.
- **Profile settings in a member crate.** They are silently ignored.

## Practice

1. Which settings of the `dist` profile above would you remove for a server that needs
   readable crash reports and uses `catch_unwind` around each request?
2. A crate has features `fast-hash` and `secure-hash`. Each selects the algorithm behind
   one function `hash()`, and enabling both is a `compile_error!`. Why is this a problem in
   a large workspace, and how would you redesign it?
3. CI builds with `cargo build --release`, and `Cargo.lock` is in `.gitignore`. A dependency
   publishes a broken patch release. What happens, and which two changes prevent it?

### Answers

1. Remove `panic = "abort"`, because with it `catch_unwind` catches nothing and one bad
   request ends the process. Remove `strip = "symbols"`, or keep an unstripped copy of every
   released binary. `opt-level = "z"` should probably go too: a server wants speed.
2. If one crate in the workspace enables `fast-hash` and another enables `secure-hash`,
   unification turns both on and the build fails for a third person who can change neither.
   Make the features additive: each adds its own function or type (`fast_hash()`,
   `secure_hash()`), and the caller chooses in code.
3. With no lock file, every CI run resolves dependencies afresh and picks up the broken
   release, so a commit that changed nothing fails or, worse, ships the bug. Commit
   `Cargo.lock`, and build with `--locked` so that an out-of-date lock file is an error.

## Key takeaways

- Release settings trade build time, debuggability and unwinding for speed and size.
- Cross-compiling needs the target's standard library and a linker for it.
- A workspace shares one lock file, one `target` directory and common settings.
- Features are unified across the dependency graph, so they must be additive.
- Lock, audit and minimise dependencies, and remove machine-specific inputs for a
  reproducible build.

## Further reading

- [The Cargo Book: Profiles](https://doc.rust-lang.org/cargo/reference/profiles.html)
- [The Cargo Book: Features](https://doc.rust-lang.org/cargo/reference/features.html)
- [The Cargo Book: Workspaces](https://doc.rust-lang.org/cargo/reference/workspaces.html)
- [The rustc book: Remap source paths](https://doc.rust-lang.org/rustc/remap-source-paths.html)
