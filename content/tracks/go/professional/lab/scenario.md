Saltwick is a small fishing harbour with a dozen pontoon berths kept for visiting yachts. In
summer the harbour office takes bookings by VHF radio, by phone and by e-mail, writes them in a
ledger, and twice this season gave the same berth to two boats on the same night. The harbour
board has agreed to a small booking service: the harbour's website and the office's laptop
will both talk to it over HTTP and JSON, it will run as one binary in a container on the
office's server, and the harbour master alone may cancel a booking. The berths, the body size
limit and the address it listens on must be settable without a rebuild, and when something
goes wrong at two in the morning the logs must say what happened without ever showing the
harbour master's token. The bookings themselves live behind a `Store` interface, already
written with an in-memory version; your part is everything between the network and that
store.
