The community greenhouse has a moisture probe in every raised bed and a small Python library that
decides which beds need water. The volunteers' scheduler imports it, so the library must log
without taking over the scheduler's logging, and it reads its settings from a TOML file that the
environment can override.
