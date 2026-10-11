# Operations and maintenance

Owner: the Chronos operator. Review this runbook after releases, incidents, provider changes and access changes. The current website uses Stripe test payments; the inventory workflow is private and manual; Meta account connection remains an owner setup gate. Component status and dated evidence are in [VERIFICATION.md](VERIFICATION.md).

## Responsibility and service boundaries

| Responsibility | Accountable role | Required record |
|---|---|---|
| Releases, rollback, dependency maintenance | Maintainer | Commit, checks, review, artifact hashes, deployed scope |
| Hosting, DNS, TLS, monitoring, backup/restore | Operator | Private access recovery, alerts, restore evidence |
| Product descriptions, media rights, stock, prices and fulfilment | Business owner | Approved source records and change history |
| Privacy, consumer terms, tax and market eligibility | Business owner with qualified advisers | Market-specific decisions and review dates |
| Payment reconciliation and refunds | Merchant operator | Provider/order reconciliation and exception handling |
| Advertising and marketplace publication | Account owner | Explicit approval and platform permission evidence |

One person may hold several roles. Assign a reachable primary and alternate before promising response times. There is currently no staffed 24/7 on-call service. Publishing source does not enable a deployment, paid provider, advertising campaign or n8n webhook.

## Routine work

| Cadence | Work | Evidence and escalation |
|---|---|---|
| Every release | Local tests, review, scan, dependency audit, build and route checks; compare live files before rollout | Use [DEPLOYMENT.md](DEPLOYMENT.md); retain the previous artifact and verify every deployed hash |
| Daily operational target | Independent HTTPS checks; CMS/API health; payment exceptions; failed workflow executions; storage/DB capacity; backup completion | Alert on business-flow failure even when the homepage still works |
| Weekly | Dependency alerts; TLS/domain expiry; account/token expiry; queue age; disk/log growth; draft inventory review | Record owner and deadline for unresolved findings |
| Monthly | Access/MFA review; SLO coverage and budget; retention jobs; recovery contact checks; cost review | Remove unused access after ownership verification; record changes privately |
| Quarterly target | Isolated restore exercise; incident exercise; legal/content review; configuration and secret review | Measure recovery time and recovered data timestamp; check rights requests and notification contacts |

These are operating requirements, not a claim that all schedules are automated. [AVAILABILITY-AND-DR.md](AVAILABILITY-AND-DR.md) identifies current backup and monitoring gaps.

## Release and rollback checklist

1. Define scope, acceptance criteria, configuration changes and schema implications. Identify which runtime changes are actually being deployed.
2. Capture remote versions of touched files privately; compare against local source. Reconcile newer remote changes before editing or uploading.
3. Validate the local candidate using [TESTING.md](TESTING.md). Keep secrets, DB exports, personal verification scripts and recovery documents out of the publication tree.
4. Review the exact diff in a fresh context. Publish through a branch and reviewed PR with green checks; verify commit attribution and the merged tree.
5. Before a separate rollout, take a recoverable private backup of changed state. Upload a new versioned frontend artifact or the scoped plugin/service files. Validate configuration, ownership, mounts and health before promotion.
6. Exercise public routes, drafts/404s, login/logout, contact persistence and test checkout as applicable. Inspect browser errors and responsive/keyboard behavior. Compare local and remote SHA-256 for every deployed file.
7. Roll back to the retained release if acceptance fails. Code rollback does not undo a database migration; test schema restoration separately. Record escaped defects in [DEFECT-LOG.md](../DEFECT-LOG.md).

Never put a production database, uploads archive, token-bearing execution log or server recovery bundle in a public Actions artifact. Artifact upload requires explicit content classification.

## Interrupted automation

**Inventory:** inspect the persisted batch summary and process only its first pending ordinal. A completed item returns its stored historical result. A newer accepted batch supersedes older pending work; empty source reconciliation also invalidates it. Start a fresh complete source sync if the batch is superseded. Recheck current stock, price, photos and platform rules before external publication. Queue records are private drafts, not an external marketplace listing.

The new freshness table is created on startup without deleting existing data. Older databases have no active-batch marker until a new intake; their unfinished legacy items fail closed. Back up the volume and run a new complete sync after upgrading. The publication release does not itself roll out this service upgrade.

**Advertising:** inspect proposal status and account state after interruption. An uncertain provider write must be reconciled before another attempt. Approval is a separate interactive owner step; a conversation or retrieved ad text cannot grant it. Follow the [advertising recovery procedure](../integrations/meta-ads/README.md#recovery-after-power-loss).

**n8n:** retain the encryption key with encrypted volume backups; a DB alone cannot decrypt credentials. Keep host ports on loopback, use a secure tunnel, and distinguish container network binding from public exposure. Workflow publication and review-queue publication are separate decisions.

## Backup and restore acceptance

Back up the CMS database, uploads, plugin/version manifest, private deployment settings, inventory SQLite state, n8n data and encryption key, and advertising proposal state. Use separate least-privilege backup and restore access. Encrypt before off-host transfer; document retention, legal holds and deletion propagation. Test restoration into an isolated environment that cannot send messages, charge cards or publish ads/listings.

A restore passes only after database integrity, representative content, account ownership checks, paid-session reconciliation in test mode, queue/proposal state, asset references and permissions are verified. Record the source backup time, completion time, scope, lost-data window and deviations against the RPO/RTO target. Approve capacity and costs before provisioning storage or running distributed traffic.

## Incident handoff

Record UTC timestamps, affected release/routes, user impact, last known working state, logs retained privately, containment, rollback decision, recovery proof, legal-notification decision and follow-up owner. Rotate exposed credentials and revoke affected sessions where supported. Public incident notes contain impact and remediation, never secrets or exploitable infrastructure detail. The private dossier and project-local checkpoint retain the complete timeline so another maintainer can resume after power loss.

Sources: [Google SRE incident response](https://sre.google/workbook/incident-response/), [n8n encryption key](https://docs.n8n.io/hosting/configuration/configuration-examples/encryption-key/), [WordPress backups](https://developer.wordpress.org/advanced-administration/security/backup/).
