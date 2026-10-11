# Configuration and secret ownership

Configuration has one owner per boundary. Public build settings are validated before use; secrets belong to the service that needs them. A frontend environment variable is visible to every visitor after compilation.

| Boundary | Authoritative owner | Safe template / validation |
|---|---|---|
| Frontend mode, API/site origins, search policy, media behavior | `src/config/settings.ts` | Root `.env.example`; Zod validation |
| Build/render paths and limits | `config/build.json` | Build scripts consume maintained data |
| Catalogue exclusions and reading speed | `config/catalogue.json`, `src/config/catalogue.ts` | Shared runtime/render policy |
| Header thresholds and maintained navigation | `src/content/navigation.json`, `src/config/navigation.ts` | Validated data consumed by header/footer |
| Editorial source and product/UI copy | `src/content/*.json` | Source content manifests; WordPress remains connected runtime authority |
| Capacity model and availability probes | `config/operations.json` | `capacity:model` and `monitor:once` |
| Frontend container/image/port | `deploy/shared-vps/runtime.env.example`, Compose and server templates | Render placeholders for the selected release |
| Backend database/JWT/provider secrets | Private WordPress configuration and administrator settings | Never place values in frontend JSON or Git |
| Advertising provider/host settings, API version, account, limits and state | `integrations/meta-ads/src/chronos_ads/config.py` | Component `.env.example`; maintained business profile and tool data |
| Inventory source, currency, hosts, limits, token and SQLite | `integrations/inventory/src/chronos_inventory/config.py` | Component `.env.example`; Pydantic validation |
| Inventory container paths/binding and n8n resources/images/encryption | `integrations/inventory/deploy/compose.yaml` | `deploy/.env.example`; container overrides take precedence |
| n8n graph structure, credential IDs and service origin | `integrations/inventory/workflow-settings.json` | Generator and checked-in `workflow.json` parity test |

The advertising MCP server makes no inference API request and has no model ID to configure. The Claude host owns its model and subscription/provider policy. Any future inference integration must obtain its model/provider settings from its typed configuration and its secrets from approved private storage.

## Environment changes

Copy the relevant safe example into an ignored private file, configure only required access, and validate without printing the values. Relative advertising paths resolve against its environment file. Inventory local paths resolve against the process working directory; the container explicitly overrides its database to the writable `/state` volume. Internal container listening allows the private n8n service to connect while published host ports stay on `127.0.0.1`.

Frontend settings are compiled into the artifact; changing them requires a rebuild. Provider settings used by a long-lived Python service require a restart. Generate the n8n graph after changing workflow settings and verify import/update scope before publication. Follow [OPERATIONS.md](OPERATIONS.md) for drift, backups and parity checks before deploying any change.

## Secret handling

Keep actual credentials in approved environment/secret storage and the project's ignored recovery file. Verify Git ignore rules before writing private recovery data. Never include credentials, personal account identifiers, raw provider responses, private keys, access tokens, database dumps or token-bearing URLs in public docs, command arguments, screenshots or CI logs.

Use separate credentials for webhook intake, the inventory service, n8n encryption and Meta access. Scope Meta access to the intended account. Restrict administrator access, enable MFA where supported, record expiry and revoke/rotate after exposure or ownership change. Do not paste tokens into Claude conversations. Settings errors must emit bounded messages; structured validation exceptions may contain inputs and must not be logged wholesale.

## Configuration audit before release

Verify examples cover typed fields; defaults have one owner; changeable provider URLs, versions, limits and prices do not appear in business logic; test keys and reserved domains are clearly synthetic; and private files are ignored and absent from staged content/history. Scan the exact publication tree for credentials and private-key material. Preserve stable protocol identifiers and licensed upstream examples only after examining their provenance; document any finding rather than suppressing it.

See [SECURITY-OPERATIONS.md](SECURITY-OPERATIONS.md), [TESTING.md](TESTING.md) and each component's README for concrete gates.
