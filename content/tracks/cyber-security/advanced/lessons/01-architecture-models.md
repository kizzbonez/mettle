---
title: Architecture Models
summary: Compare on-premises, cloud (public, private, hybrid, community, serverless, multicloud), infrastructure as code, microservices, OT and air-gapped networks by what each one changes for security, and weigh the technical and business considerations of SY0-801 objective 3.1.
minutes: 35
objectives:
  - Describe the four NIST cloud deployment models and serverless and multicloud designs, and say who secures what in each
  - Explain how infrastructure as code, microservices, OT and air-gapped networks change the attack surface and the controls
  - Weigh availability, resilience, usability, compute, power and recovery against sovereignty, classification, cost, ownership and risk when choosing an architecture
---

## Outline

1. Where the system runs: on-premises and cloud
2. Who secures what: shared responsibility
3. Serverless and multicloud
4. Infrastructure as code
5. Microservices
6. OT and air-gapped networks
7. Choosing: technical and business considerations

## Where the system runs

An **architecture model** is the overall shape of a system: where its computers are, who runs them and how its parts talk. It decides which controls you can use and who must apply them.

**On-premises** infrastructure is hardware the organization owns in its own building or a rented rack: full control from the door lock to the hypervisor, and full responsibility for patching, power, cooling, spare parts and skilled staff.

**Cloud computing**, in NIST's definition (SP 800-145), is on-demand network access to a shared pool of configurable resources that "can be rapidly provisioned and released with minimal management effort." NIST names four **deployment models**:

- **Public cloud**: provisioned for open use by the general public, on the provider's premises.
- **Private cloud**: for the exclusive use of a single organization; it may be run by that organization or a third party, on or off premises.
- **Community cloud**: for the exclusive use of a community of organizations with shared concerns, such as a group of hospitals with the same compliance rules.
- **Hybrid cloud**: two or more of these, still distinct, bound together by technology that lets data and applications move between them.

## Who secures what

The provider and the customer split the work, and the split moves with the **service model**: infrastructure as a service (IaaS) rents virtual machines and networks, platform as a service (PaaS) rents a managed runtime or database, and software as a service (SaaS) rents a finished application. AWS describes the split as security **of** the cloud (the provider's hardware, network and facilities) versus security **in** the cloud (the customer's data, identities and configuration).

```text
Layer                         IaaS        PaaS        SaaS        Serverless
Data and its classification   customer    customer    customer    customer
Identities and permissions    customer    customer    customer    customer
Application code              customer    customer    provider    customer
Runtime and middleware        customer    provider    provider    provider
Guest operating system        customer    provider    provider    provider
Virtualization and hardware   provider    provider    provider    provider
Physical data center          provider    provider    provider    provider
```

The top two rows never move: in every model the customer decides who may read the data. Most cloud breaches happen there (a bucket made public, an access key committed to a repository), not in the provider's data center.

## Serverless and multicloud

**Serverless** computing runs your functions on demand; the provider runs the servers, operating system and scaling. There is no host to patch, but each function still has an identity, and its permissions are the attack surface. A function that only reads uploads and writes invoices should hold exactly those rights:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {"Effect": "Allow", "Action": "s3:GetObject",
     "Resource": "arn:aws:s3:::clinic-uploads/incoming/*"},
    {"Effect": "Allow", "Action": "dynamodb:PutItem",
     "Resource": "arn:aws:dynamodb:eu-west-1:111122223333:table/Invoices"}
  ]
}
```

A policy with `"Action": "*"` and `"Resource": "*"` turns any injection bug in the function into control of the whole account.

**Multicloud** uses two or more providers, for resilience or to avoid **vendor lock-in**. It also doubles the identity systems, logging formats and policy languages your team must master, so misconfiguration risk rises unless the controls are defined once and applied everywhere.

## Infrastructure as code

**Infrastructure as code (IaC)** describes servers, networks and firewall rules in version-controlled files that a tool such as Terraform applies. Every change is reviewed, repeatable and auditable, and a destroyed environment can be rebuilt from the files. The risk is that one bad line is deployed everywhere at once. This rule opens SSH to the internet:

```hcl
resource "aws_vpc_security_group_ingress_rule" "admin_ssh" {
  security_group_id = aws_security_group.app.id
  cidr_ipv4         = "0.0.0.0/0"
  from_port         = 22
  to_port           = 22
  ip_protocol       = "tcp"
  description       = "temporary admin access"
}
```

Because the plan can be exported as JSON (`terraform show -json plan.out`), a pipeline can check it before anything is built. This small policy check reads the plan's `resource_changes` and refuses administrative ports open to the world:

```python
import json
import sys

ADMIN_PORTS = {22, 3389, 5432, 3306}

plan = json.load(open("plan.json"))
problems = 0
for change in plan["resource_changes"]:
    if change["type"] != "aws_vpc_security_group_ingress_rule":
        continue
    rule = change["change"]["after"]
    open_world = rule.get("cidr_ipv4") == "0.0.0.0/0"
    ports = set(range(rule["from_port"], rule["to_port"] + 1))
    if open_world and ports & ADMIN_PORTS:
        print(f"DENY  {change['address']}: port {rule['from_port']} open to 0.0.0.0/0")
        problems += 1
    else:
        print(f"ok    {change['address']}")
sys.exit(1 if problems else 0)
```

```text
ok    aws_vpc_security_group_ingress_rule.web_https
DENY  aws_vpc_security_group_ingress_rule.admin_ssh: port 22 open to 0.0.0.0/0
ok    aws_vpc_security_group_ingress_rule.db_from_app
```

The exit status 1 fails the pipeline. Changes made by hand in the console, outside the code, cause **drift**: the real environment no longer matches the reviewed files, so IaC teams detect drift and forbid console changes.

## Microservices

A **microservices** architecture splits an application into small services that each own one job and talk over the network through APIs. Each can be patched and scaled alone, and a compromise of one need not expose the others. But calls that used to be function calls inside one program are now network traffic between services (east-west traffic), so every service needs its own identity, authentication of its callers (often mutual TLS), authorization and logging. NIST SP 800-204 bundles these into an **API gateway** at the edge or a **service mesh** between services, with throttling and circuit breakers so one failing service cannot drag down the rest.

## OT and air-gapped networks

**Operational technology (OT)** is, in NIST SP 800-82 Rev. 3, programmable systems that "interact with the physical environment": industrial control systems, programmable logic controllers (PLCs), building management and SCADA (supervisory control and data acquisition). Their priorities differ from IT. Availability and human safety come first, devices run for decades on unsupported software, and a vulnerability scan or a reboot can stop a production line. Controls therefore lean on isolation, monitoring and strict change windows rather than frequent patching.

An **air-gapped network** has no network connection to any other network. It protects classified systems and critical controllers, but data still crosses the gap on removable media, updates and maintenance laptops, which is how Stuxnet reached its targets. An air gap needs media scanning, device control and logged transfers to stay a gap.

## Choosing: technical and business considerations

Security+ names the factors to weigh:

- **Technical**: **availability** (can users reach it), **resilience** (does it survive a failure), **proprietary versus open source** (vendor support and closed code versus public scrutiny and self-support), **usability** (controls people work around are not controls), **responsibility** (who patches what), **compute** (enough capacity for encryption, inspection and peaks), **power requirements** (OT sites and edge devices may run on limited power), and **ease of recovery** (rebuild from IaC in an hour, or reinstall a controller by hand).
- **Business**: **data sovereignty** (data is subject to the laws of the country where it is stored), **data classification** (restricted data may forbid public cloud), **cost**, **ownership** (who owns the systems and the data, and who is accountable), **environmental requirements** (climate, flooding, heat), **scalability**, and **risk** (what the organization will accept).

## Common mistakes

- Assuming the cloud provider secures your data. The provider secures the platform; access policies, encryption choices and identities stay yours.
- Granting a serverless function or service account `*` permissions "to get it working".
- Changing IaC-managed resources by hand, so the code no longer describes reality.
- Scanning or patching OT like office IT, without the owner and a maintenance window.
- Calling a network air-gapped while a vendor's remote-support modem or a shared USB stick crosses it.

## Practice

1. Four regional water utilities want one shared platform that meets the same regulator's rules, run by a contractor. Which deployment model is this?
2. A company moves its HR system from virtual machines (IaaS) to a SaaS product. Which responsibilities move to the provider, and which stay?
3. Extend the plan check so it also refuses a rule whose `cidr_ipv6` is `::/0` on an admin port.
4. A factory asks to put its PLC network in the public cloud "for resilience". Name two considerations that argue against it.

### Answers

1. A community cloud: exclusive use by organizations with shared concerns, operated by a third party.
2. The provider takes over the operating system, runtime and application code. The company keeps its data, its classification and who has access (identities, roles, sharing settings).
3. Change the test to
   `open_world = rule.get("cidr_ipv4") == "0.0.0.0/0" or rule.get("cidr_ipv6") == "::/0"`.
4. Availability and safety: a controller must keep running if the internet link fails, and latency or an outage could stop a physical process. Also responsibility and risk: the OT devices still run on site, so the cloud adds an external path to safety-critical equipment.

## Key takeaways

- NIST's deployment models are public, private, community and hybrid; serverless and multicloud are designs on top of them.
- Shared responsibility moves the lower layers to the provider, never your data or identities.
- IaC makes infrastructure reviewable and rebuildable; check plans automatically and prevent drift.
- Microservices and serverless turn internal calls into network calls, so identity and least privilege matter more.
- OT puts safety and availability first; air gaps must be guarded where media crosses them.

## Further reading

- [NIST SP 800-145: The NIST Definition of Cloud Computing](https://csrc.nist.gov/pubs/sp/800/145/final)
- [AWS: Shared Responsibility Model](https://aws.amazon.com/compliance/shared-responsibility-model/)
- [NIST SP 800-82 Rev. 3: Guide to Operational Technology Security](https://csrc.nist.gov/pubs/sp/800/82/r3/final)
- [Terraform JSON output format](https://developer.hashicorp.com/terraform/internals/json-format)
