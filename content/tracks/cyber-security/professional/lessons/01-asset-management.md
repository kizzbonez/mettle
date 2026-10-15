---
title: Asset Management
summary: Manage hardware, software and data assets through their whole life cycle (SY0-801 objective 4.2). Plan and scope the inventory, buy safely, assign owners, track what is really on the network, and decommission with sanitization, destruction and a certificate, following NIST SP 800-88 Rev. 2.
minutes: 35
objectives:
  - Explain why an accurate asset inventory underlies every other security control
  - Describe each stage of the asset life cycle and the security task at each stage
  - Reconcile an inventory against discovery data and act on unknown, missing and retired assets
  - Choose clear, purge or destroy for a device and document the result with a certificate of sanitization
---

## Outline

1. You cannot protect what you do not know
2. Planning and scoping
3. Acquisition and procurement
4. Assignment and accounting
5. Monitoring and asset tracking
6. Disposal and decommissioning
7. Sanitization, destruction and certification

This lesson covers SY0-801 objective 4.2.

## You cannot protect what you do not know

An **asset** is anything of value that the organization must protect: **hardware** (laptops,
servers, switches, printers, phones, sensors), **software** (installed programs, licenses, software
as a service (SaaS) subscriptions, cloud resources) and **data** (databases, file shares,
backups). The NIST Cybersecurity Framework (CSF) 2.0 begins its Identify function with Asset
Management (ID.AM): inventories of hardware (ID.AM-01), of software, services and systems
(ID.AM-02) and of data (ID.AM-07), and management of all of them "throughout their life
cycles" (ID.AM-08).

Everything later in this level depends on that inventory: a vulnerability scanner scans only the
ranges it is given, a security information and event management (SIEM) system alerts only on
hosts that send it logs, and a responder needs to know who owns the server that is encrypting
files. An unknown asset is unpatched, unmonitored and unowned.

## Planning and scoping

Decide what the inventory covers (offices, data centers, cloud accounts, remote laptops, phones,
operational technology, personal devices or not), which fields each record holds, and which
system is the **system of record**, usually a configuration management database (CMDB). Scope
includes data: which data types are inventoried and how they are classified, because
classification decides how an asset is handled and, at the end, how it is sanitized.

## Acquisition and procurement

Security starts before the purchase. Procurement is a control point:

- Buy from approved vendors and authorized channels, so hardware is genuine and firmware is
  signed, and check the vendor's end-of-support date before buying.
- Put security requirements into the request (encryption, logging, single sign-on, patch
  commitments) and review SaaS before anyone signs up.
- Record the asset at receipt: asset tag, serial number, purchase order, warranty.

A storage device bought on a manager's corporate card never passes this gate, which is how
**shadow IT** enters the network.

## Assignment and accounting

Each asset gets an **owner** (the business person accountable for it), a **custodian** (the team
that runs it day to day), a user if it is personal equipment, a location and a classification
taken from the most sensitive data it holds. **Accounting** ties the record to finance (the
fixed-asset register and depreciation) and to license counts, so the organization can prove it
owns what it runs. A record looks like this:

```text
asset_tag,hostname,mac,owner,custodian,classification,status
NW-00412,lt-ops-112,3c:52:82:1a:4f:09,Logistics,IT Service Desk,confidential,in-service
NW-00413,lt-ops-113,3c:52:82:1a:4f:7d,Logistics,IT Service Desk,confidential,in-service
NW-00488,prn-dock-02,00:1b:63:84:45:e6,Warehouse,IT Service Desk,internal,in-service
NW-00501,srv-wms-01,52:54:00:6b:2a:11,Warehouse,Infrastructure,restricted,in-service
NW-00377,lt-fin-077,3c:52:82:19:aa:02,Finance,IT Service Desk,restricted,disposed
```

## Monitoring and asset tracking

Inventories go stale the day they are written, so they are reconciled against what is really
there. **Active discovery** scans address ranges; **passive discovery** reads Dynamic Host
Configuration Protocol (DHCP) leases, switch address tables and flow records; **agents** (endpoint
detection and mobile device management) report hardware and installed software; cloud provider
APIs list every resource; physical tracking uses barcodes, radio-frequency identification (RFID)
tags and, for vehicles, GPS. The script below compares a discovery export (`discovery.csv`) with
the inventory above, matching on the network card's media access control (MAC) address:

```bash
awk -F, '
  NR == FNR { if (FNR > 1) { mac = tolower($3); tag[mac] = $1; name[mac] = $2; status[mac] = $7 }; next }
  FNR > 1 {
    mac = tolower($2); seen[mac] = 1
    if (!(mac in tag))
      print "UNKNOWN  " $1 " " mac " calls itself " $3
    else if (status[mac] != "in-service")
      print "RETIRED  " tag[mac] " (" name[mac] ") is " status[mac] " but answered at " $1
  }
  END { for (mac in tag) if (status[mac] == "in-service" && !(mac in seen)) print "MISSING  " tag[mac] " (" name[mac] ") was not seen" }
' inventory.csv discovery.csv | sort
```

```text
MISSING  NW-00413 (lt-ops-113) was not seen
RETIRED  NW-00377 (lt-fin-077) is disposed but answered at 10.20.4.66
UNKNOWN  10.20.4.90 b8:27:eb:5d:31:c2 calls itself raspberrypi
```

Each line is a security question. The unknown device may be a rogue access point or a forgotten
project: find it, then register or remove it. The missing laptop may be switched off or stolen:
ask its owner, and if it is lost, revoke its certificates and wipe it remotely. The "disposed"
Finance laptop is still on the network, so the disposal process failed somewhere.

Software is tracked the same way. Comparing installed packages with the approved list catches a
remote-access tool that nobody approved:

```bash
cut -d' ' -f1 installed.txt | sort > installed-names.txt
sort approved.txt > approved-sorted.txt
echo "Installed but not approved:"
comm -23 installed-names.txt approved-sorted.txt
```

```text
Installed but not approved:
anydesk
```

## Disposal and decommissioning

Retiring an asset is a procedure. Remove it from service (disable its accounts, revoke its
certificates, delete its DNS records and firewall rules), check **retention requirements and
legal holds** before erasing anything, sanitize the media, record what was done, update the
inventory, and only then resell, donate or recycle it under the local electronic-waste rules.
Remember the storage people forget: copiers, network devices, phones, virtual machine disks,
cloud snapshots and backup tapes.

## Sanitization, destruction and certification

NIST SP 800-88 Rev. 2, *Guidelines for Media Sanitization* (September 2025), defines three
methods:

- **Clear** applies logical techniques to all user-addressable storage, through the normal
  interface, against simple, non-invasive recovery: overwriting, or a factory reset on a device
  that cannot be rewritten.
- **Purge** makes recovery infeasible even with state-of-the-art laboratory techniques while
  leaving the media potentially reusable: the device's own sanitize commands (block erase,
  overwrite), **cryptographic erase** (destroying the keys that encrypted the data), or
  degaussing for magnetic media matched to its strength. The guide sends readers to IEEE 2883
  for the technique that suits each media type.
- **Destroy** makes recovery infeasible and the media unusable: disintegrate, incinerate, melt,
  pulverize or shred. Drilling a hole or bending a drive only partly damages it.

Media type matters. Flash drives spread writes across spare cells (wear leveling), so an
overwrite cannot reach every copy; degaussing does nothing to a solid-state drive (SSD); and for
cloud storage, where you never touch the disks, cryptographic erase is often the only purge
available. The revision separates **verification** (did the tool or shredder complete without
errors?) from **validation** (do the results satisfy the organization that the data is
sanitized?), then asks for a **certificate of sanitization** for each item:

```text
CERTIFICATE OF SANITIZATION                         Record SAN-2026-0193
Manufacturer / model:   Samsung PM9A1 NVMe SSD      Serial: S64HNE0R512339
Property number:        NW-00377 (laptop lt-fin-077)  Media type: ISM (flash)
Media source:           Finance user laptop          Pre-sanitization category: restricted
Method:                 Purge                        Technique: cryptographic erase (NVMe Sanitize)
Tool and version:       vendor toolkit 8.1.0
Verification method:    tool completion status, no errors; drive health checked
Performed by:           K. Mensah, IT Asset Technician, 2026-10-15, Depot B
Validated by:           R. Alvarez, Security Analyst, 2026-10-15, Depot B
```

When a contractor shreds media, the organization keeps the contractor's certificate of
destruction and the chain-of-custody record showing who handled the drives until they were
destroyed.

## Common mistakes

- Building the inventory once and never reconciling it with discovery data.
- Running a multi-pass overwrite on an SSD and recording it as purge.
- Degaussing solid-state media, or drilling one hole and calling it destroyed.
- Wiping a device whose data is under a legal hold or still inside its retention period.
- Disposing of a device without updating its record, so the inventory and reality disagree.
- Making IT the owner of everything, so no business person answers for the data.

## Practice

1. A laptop SSD that held restricted data is going to a refurbisher. Which method, and what
   evidence do you keep?
2. The reconciliation shows `UNKNOWN 10.20.6.12 ... calls itself NAS-BACKUP`. What do you do?
3. A cloud database is being retired. How can its storage be purged?
4. A team buys a SaaS file-sharing service on a credit card. Which life cycle stage failed?

### Answers

1. Purge, because the drive will be reused: the vendor's sanitize command or cryptographic
   erase on a self-encrypting drive. Verify the tool's completion status, validate the result,
   and complete a certificate of sanitization. If no reliable purge exists for that model,
   destroy it instead.
2. Locate it (switch port, DHCP lease, owner enquiries), then either register it with an owner,
   custodian and classification or remove it. A backup device nobody knew about may hold copies
   of sensitive data.
3. Cryptographic erase: destroy the customer-managed encryption keys after confirming that
   retention and legal holds allow it, including the keys for snapshots and backups, and record
   it.
4. Acquisition and procurement: the purchase bypassed the review that would have assessed and
   registered it.

## Key takeaways

- The inventory (hardware, software, data) is the base for scanning, monitoring and response.
- Each stage has a security task: scope, buy safely, assign owners, reconcile, decommission.
- Reconcile inventory against discovery: unknown, missing and retired-but-present all need action.
- SP 800-88 Rev. 2: clear, purge or destroy matched to the media, then verify, validate and certify.

## Further reading

- [NIST SP 800-88 Rev. 2, Guidelines for Media Sanitization](https://csrc.nist.gov/pubs/sp/800/88/r2/final)
- [NIST Cybersecurity Framework 2.0 (CSWP 29)](https://nvlpubs.nist.gov/nistpubs/CSWP/NIST.CSWP.29.pdf)
- [CIS Control 1: Inventory and Control of Enterprise Assets](https://www.cisecurity.org/controls/inventory-and-control-of-enterprise-assets)
