Brightwater is a regional water utility with 1.4 million smart meters. Every night each meter
uploads its readings as plain text lines, and an import service totals the usage and relays it,
in batches, to the billing system.

The import service was written as a prototype, and the night shift has three complaints:

- **It is slow and the memory graph is a saw blade.** A profile of last night's run shows most of
  the time in `string.Split` and the garbage collector. Two million lines become ten million
  short-lived strings.
- **Customers are billed twice.** Meters on a weak signal resend readings they are not sure
  arrived. The prototype counts every copy, and the totals are built by several importer threads
  at once, which the original `Dictionary` was never meant to survive.
- **Billing falls over.** The relay starts every batch at once. The billing gateway allows a few
  calls at a time, answers the rest with "busy", and the prototype gives up on the first error,
  so one bad batch can stop the night's run.

You are rewriting the three parts that matter: the line parser, the usage ledger and the relay.
The gateway is reached through an interface, so the tests can stand in for it.
