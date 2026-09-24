# Security Policy

## Supported versions

| Version | Supported |
|---------|-----------|
| `main` branch and the currently deployed release | Yes |
| Older commits and retired deployment pipelines (cPanel, Cloudflare Pages) | No |

## Reporting a vulnerability

**Please do not open a public issue for security problems.**

Preferred: use GitHub's private vulnerability reporting on the
[Security tab → Report a vulnerability](https://github.com/Zahidulislam2222/Chronos/security/advisories/new).

Alternative: email **muhammadzahidulislam2222@gmail.com** with the subject
`SECURITY: Chronos — <short description>`.

### What to include

- Affected component (frontend, `chronos-bridge`, `chronos-blocks`, workflow,
  deployment config) and version or commit
- Steps to reproduce, with a minimal safe proof of concept
- Impact you observed or expect
- A suggested fix, if you have one

Do not include other people's personal data. Do not use real payment cards;
the demo accepts Stripe **test mode** only.

### Response targets

| Step | Target |
|---|---|
| Acknowledgement | 72 hours |
| Initial assessment and severity | 7 days |
| Fix or mitigation for high/critical issues | 30 days |
| Public advisory | After a fix is available, coordinated with the reporter |

These are good-faith targets from a single maintainer, not a staffed 24/7
service. There is no paid bug bounty.

### Safe-harbour testing rules

- Test against **your own local copy** (see the README), not the public demo.
- Do not run load tests, denial-of-service tests, automated mass scanning or
  social engineering against the public demo or its hosts.
- Do not access, modify or delete data that is not yours; stop and report
  as soon as you see someone else's data.

Good-faith research that follows these rules will not be pursued.

### In scope

- Authentication and authorisation bypass (JWT, REST capability checks)
- Payment integrity: price tampering, replay, marking unpaid orders as paid
- Injection (SQL, XSS, template), CSRF, SSRF
- Sensitive data exposure, including secrets in the repository
- CI/CD issues, for example a workflow that exposes secrets to pull requests
- Security headers or CSP bypass on the frontend origin

### Out of scope

- WordPress core and third-party plugins that are not in this repository
  (report to their maintainers; for WordPress core see
  [WordPress security](https://hackerone.com/wordpress))
- Missing best-practice headers with no demonstrated impact
- Volumetric DoS
- Findings that need physical access or a compromised device

## Recognition

Valid reports are credited in the fix commit, the advisory and
[CHANGELOG.md](CHANGELOG.md), unless you prefer to stay anonymous.

## More

- Threat model: [docs/THREAT-MODEL.md](docs/THREAT-MODEL.md)
- Security operations: [docs/SECURITY-OPERATIONS.md](docs/SECURITY-OPERATIONS.md)
- Incident response: [docs/AVAILABILITY-AND-DR.md](docs/AVAILABILITY-AND-DR.md#incident-response)
