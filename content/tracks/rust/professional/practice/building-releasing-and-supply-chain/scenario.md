On Friday a workspace of thirty crates stopped building: the `hasher` crate hit a
`compile_error!` because two features that exclude each other were both switched on. No
`Cargo.toml` in the workspace names both of them, so you are writing the tool that shows what
Cargo unifies and which crates asked for what.
