The Brightwater Veterinary Group runs three animal clinics with about sixty vets, nurses and
receptionists. A small server room at the main clinic holds the booking system, the practice
database, file shares and backups; the booking web application and a monitoring stack run in
Docker. One IT administrator, Noor, looks after everything with help from a managed service
provider.

The group's cyber insurer has asked for an architecture and controls review before it renews the
policy. Last year's review was done by hand in a spreadsheet, and it missed a "temporary" firewall
rule that had let the whole staff network reach every server for eighteen months. This year Noor
wants a script that reads the exports and reports the findings the same way every month, so that
nothing depends on someone's eye.

She has exported four kinds of evidence into `data/`:

```text
firewall-rules.csv        the internal firewall's rule base (zones: internet, guest, staff,
                          dmz, servers, mgmt)
compose-*.json            each Docker Compose project, as `docker compose config --format json`
accounts.csv              the directory's accounts with their type, last logon and groups
dns-txt.txt               the TXT records of the group's DNS zones
mail-domains.txt          every domain the group owns
```

You are writing the review: code that turns these files into a list of findings the insurer and
Noor can act on, covering overly broad and shadowed firewall rules, management ports reachable
from the wrong zones, containers that run privileged or publish ports on every interface, stale
and over-privileged accounts, and missing or weak SPF and DMARC records.
