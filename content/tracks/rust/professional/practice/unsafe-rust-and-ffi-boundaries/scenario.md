The visitor kiosk at an office building's front desk runs firmware written in C. Its new
visitor log is a Rust library, so every call crosses the boundary between the two languages,
and a crash on either side leaves the lobby without badges.
