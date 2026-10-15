---
title: Identity, Federation and SSO
summary: Run the identity life cycle from identity proofing to deprovisioning, federate with SAML and OpenID Connect, know where LDAP and OAuth fit, validate tokens and assertions, and manage user, privileged, service, third-party and emergency accounts, gMSAs and privilege creep (SY0-801 objectives 4.5 and 3.2).
minutes: 40
objectives:
  - Describe provisioning, deprovisioning and identity proofing, and what a prompt leaver process must revoke
  - Explain federation and compare SAML, OAuth, OpenID Connect and LDAP, including the checks a relying party makes on an assertion or ID token
  - Choose controls for user, privileged (global and local), service, third-party and emergency access accounts, use gMSAs, and prevent privilege creep
---

## Outline

1. The identity life cycle
2. Identity proofing
3. Federation and single sign-on
4. SAML
5. OAuth and OpenID Connect
6. LDAP
7. Account types and gMSAs
8. Privilege creep

## The identity life cycle

Every account follows the same path: a person joins, moves and leaves. **Provisioning** creates the account and grants the access the role needs, ideally automatically from the HR system through a protocol such as SCIM (System for Cross-domain Identity Management), so access starts on day one and only with the role's rights. **Deprovisioning** removes it when the person leaves. A complete leaver process disables the account the same day, revokes active sessions and refresh tokens (a disabled account with a live token can still read mail), removes group memberships, recovers devices and transfers ownership of files and service accounts. Accounts nobody deprovisioned are the stale credentials that attackers love.

## Identity proofing

**Identity proofing** establishes that a person is who they claim before a credential is issued. NIST SP 800-63A-4 (July 2025) defines three identity assurance levels (IAL1 to IAL3); the process collects evidence (a passport, a driving licence), **validates** that the evidence is genuine and current, and **verifies** that the applicant is its owner, for example by comparing their face with the photo. The same rigor applies to recovery: a help desk that resets MFA for anyone who sounds stressed on the phone has no proofing at all.

## Federation and single sign-on

**Federation** is a trust relationship between an **identity provider (IdP)**, which authenticates users, and **service providers** (SPs, or relying parties, RPs), which accept the IdP's signed statements about them. **Single sign-on (SSO)** is what users see: one login, many applications. Security improves because there is one place to enforce MFA, one place to disable a leaver, and no separate passwords stored by each SaaS application. The risk is concentration: the IdP and its signing keys become the most valuable target in the organization.

## SAML

**SAML 2.0** (Security Assertion Markup Language) is the XML-based standard for enterprise web SSO. In the common SP-initiated flow, the user opens the application; the SP redirects the browser to the IdP with an authentication request; the IdP authenticates the user and has the browser post a signed **assertion** back to the SP's assertion consumer service (ACS) URL. An assertion, shortened:

```xml
<saml:Assertion ID="_a8f3c2" IssueInstant="2026-10-14T08:00:03Z" Version="2.0">
  <saml:Issuer>https://idp.northbay-clinic.example/saml</saml:Issuer>
  <ds:Signature>...</ds:Signature>
  <saml:Subject>
    <saml:NameID>amara.okoye@northbay-clinic.example</saml:NameID>
    <saml:SubjectConfirmation Method="urn:oasis:names:tc:SAML:2.0:cm:bearer">
      <saml:SubjectConfirmationData InResponseTo="_req77" NotOnOrAfter="2026-10-14T08:05:03Z"
          Recipient="https://payroll.saas.example/acs"/>
    </saml:SubjectConfirmation>
  </saml:Subject>
  <saml:Conditions NotBefore="2026-10-14T07:59:33Z" NotOnOrAfter="2026-10-14T08:05:03Z">
    <saml:AudienceRestriction>
      <saml:Audience>https://payroll.saas.example</saml:Audience>
    </saml:AudienceRestriction>
  </saml:Conditions>
  <saml:AttributeStatement>
    <saml:Attribute Name="role"><saml:AttributeValue>payroll-approver</saml:AttributeValue></saml:Attribute>
  </saml:AttributeStatement>
</saml:Assertion>
```

The SP must check the signature against the IdP's certificate, that it is the **Audience**, that the time window is current, that `InResponseTo` matches a request it sent, and that the assertion ID has not been used before. Skipping any one of these has produced real authentication bypasses.

## OAuth and OpenID Connect

**OAuth 2.0** is about **authorization**: it lets a user grant an application limited access (scopes) to an API without giving it their password. The application receives an **access token** for the API. OAuth by itself does not say who the user is.

**OpenID Connect (OIDC)** adds authentication on top of OAuth. The IdP also returns an **ID token**, a signed JSON Web Token (JWT) whose claims describe the login. Decoded, its payload looks like this:

```json
{"iss": "https://login.northbay-clinic.example", "sub": "u-58213", "aud": "rota-app", "iat": 1791712800, "exp": 1791713100, "nonce": "q8XcV1", "amr": ["pwd", "otp"]}
```

`iss` is the issuer, `sub` the stable user ID, `aud` the client it was issued for, `exp` the expiry, `nonce` a value the client chose to stop replays, and `amr` the authentication methods (here password plus one-time password). After verifying the signature with the IdP's published key, the client applies the checks of OIDC Core section 3.1.3.7:

```python
def check_claims(claims, nonce, now):
    """Apply the OpenID Connect Core 3.1.3.7 claim checks (after the signature check)."""
    if claims["iss"] != ISSUER:
        return "wrong issuer"
    aud = claims["aud"] if isinstance(claims["aud"], list) else [claims["aud"]]
    if CLIENT_ID not in aud:
        return "not issued for this client"
    if now >= claims["exp"]:
        return "expired"
    if claims.get("nonce") != nonce:
        return "nonce mismatch (possible replay)"
    return "ok"
```

With a fixed clock, the valid token, the same token presented to a different client, the token after expiry, and a replay with the wrong nonce give:

```text
ok
not issued for this client
expired
nonce mismatch (possible replay)
```

The OAuth 2.0 Security Best Current Practice (RFC 9700, January 2025) sets today's rules: use the authorization code flow with **PKCE** (Proof Key for Code Exchange; mandatory for public clients such as mobile apps), do not use the implicit grant, never use the resource owner password grant, match redirect URIs exactly, and restrict each access token to its intended API.

## LDAP

**LDAP** (Lightweight Directory Access Protocol) is how applications query and authenticate against a directory such as Active Directory: look up a user, read group memberships, check a password with a bind. It is the back end of SSO inside an organization, not a federation protocol across organizations. Simple binds send the password, so use **LDAPS** (LDAP over TLS, port 636) or StartTLS, never plain LDAP on port 389 across a network.

## Account types and gMSAs

- **User accounts** are for one named person's daily work, with no administrative rights.
- **Privileged accounts** are either **global** (domain or tenant administrators, with rights everywhere) or **local** (administrator of one machine). Give administrators a separate **least privilege access account** for admin work (`adm-amara`), used only from a hardened admin workstation, with MFA. Randomize local administrator passwords per machine (Windows LAPS) so one stolen hash does not unlock every PC.
- **Service accounts** run software, not people: deny interactive logon and grant only what the service needs.
- **Third-party accounts** for vendors and contractors: a named sponsor, an expiry date, MFA, and access only to their systems.
- **Emergency access** (break-glass) accounts exist for when SSO or MFA fails: very few, with long random credentials stored in a safe, excluded from the policies that might lock them out, alerting on every use and tested regularly.

A service account with a static password that nobody rotates is a classic weakness. A **group Managed Service Account (gMSA)** fixes it on Windows: domain controllers generate and rotate its password (every 30 days by default), and only the servers you name may retrieve it:

```powershell
New-ADServiceAccount -Name gmsa-rota -DNSHostName gmsa-rota.corp.northbay.example -PrincipalsAllowedToRetrieveManagedPassword "Rota-Servers"
Install-ADServiceAccount -Identity gmsa-rota    # on each server in Rota-Servers
Test-ADServiceAccount -Identity gmsa-rota
```

No human knows the password, so it cannot be phished or left in a script.

## Privilege creep

**Privilege creep** is the slow build-up of access as people change roles and keep their old rights. A nurse who moved to billing still has clinical records access; an engineer who once helped on payroll is still in the payroll group. It violates least privilege and makes every compromised account more dangerous. The cures are role-based provisioning (moving role removes the old role's access), time-limited grants, and the periodic access reviews of the next lesson.

## Common mistakes

- Disabling a leaver's account but leaving their OAuth refresh tokens valid.
- Accepting a SAML assertion without checking audience, time window and replay.
- Treating an OAuth access token as proof of who the user is.
- Daily email and web browsing from a domain administrator account.
- A break-glass account that has never been tested, or that nobody is alerted about when it is used.

## Practice

1. Which ID token claim prevents a token issued to one application being used at another?
2. A vendor needs six weeks of access to a building management system. List three controls on the account.
3. Why use LDAPS rather than LDAP for an application's bind?
4. An analyst moved from finance to marketing a year ago and still edits finance spreadsheets. Name the problem and two fixes.

### Answers

1. `aud`: the client must find its own client ID there.
2. A named sponsor, an expiry date at six weeks, MFA, and access limited to that system (logged).
3. A simple bind sends the password; LDAPS encrypts it in TLS.
4. Privilege creep. Remove access on role change (mover process) and run periodic access reviews.

## Key takeaways

- Provision from HR, proof identities before issuing credentials, and deprovision everything (sessions and tokens too) on the day someone leaves.
- Federation: the IdP authenticates; SPs trust its signed assertions after checking signature, audience, time and replay.
- SAML is XML assertions; OAuth delegates authorization; OIDC adds the ID token; LDAP queries the directory.
- Separate admin accounts, sponsored third-party accounts, tested break-glass accounts and gMSAs for services.
- Privilege creep grows silently; role changes and reviews must remove access.

## Further reading

- [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html)
- [RFC 9700: Best Current Practice for OAuth 2.0 Security](https://www.rfc-editor.org/rfc/rfc9700.html)
- [NIST SP 800-63A-4: Identity Proofing and Enrollment](https://csrc.nist.gov/pubs/sp/800/63/a/4/final)
- [Microsoft: Group Managed Service Accounts overview](https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/manage/group-managed-service-accounts/group-managed-service-accounts/group-managed-service-accounts-overview)
