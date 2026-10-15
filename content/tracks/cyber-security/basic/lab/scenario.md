Kestrel Valley Mountain Rescue is a team of forty volunteers who answer calls from the police
when walkers are lost or injured on the fells. When a call comes in, the team's call-out service,
running on `callout.kestrelrescue.test`, pages every member through a radio gateway, counts who
has answered, and tells the team leader when enough people are on their way. Members sign in to
it, and to the maps server, the wiki and the VPN, from their own phones and laptops.

All of this is looked after by Amara Morgan, a volunteer who is also a medic. On 2 November 2026
the regional rescue association audits every team's systems, and its checklist has a new section
on cryptography. Amara has gathered what the auditors will ask about:

```text
data/CHECKSUMS       the manifest of call-out release 3.2.0, next to the release files
data/inventory.csv   each certificate file and the host name it serves
data/*.pem           the certificates themselves
data/accounts.txt    the stored password records exported from the call-out service
```

She already suspects trouble. The maps certificate was renewed "some time last spring", the VPN
appliance still uses the certificate it generated for itself when it was installed, and some of
the oldest accounts were imported years ago from a spreadsheet. Someone also mentioned that the
deploy script "looked different" the last time it ran.

You are writing a crypto health check, a small Python program that checks all of it the way an
auditor would: verify the release files against their manifest, inspect every certificate for
expiry, host name, key size, signature algorithm and self-signing, and flag password records that
are stored with fast or under-strength hashing. It prints one line per finding and exits with a
status that a scheduled job can act on, so the team can run it every week, not just before an
audit.
