# KAN-15 findings: out of tree

**Issue:** KAN-15 — [Server] Seed Site URL to http://localhost:8065 on first local boot  
**Status in this repo:** Cannot implement here.

## Verdict

KAN-15 describes Mattermost-style local boot behavior: seed `ServiceSettings.SiteURL` to `http://localhost:8065` when empty and `BuildNumber=dev`, so System Console no longer shows “Please configure your site URL”, and invite/email links use that origin. This workspace is the Grafana monorepo (`liam-morrissy-cursor/grafana`). Those settings, ports, and scripts do not exist in this tree.

Grafana’s analogous setting is `[server] root_url` (default port **3000**, not 8065). Changing Grafana `root_url` would not satisfy this ticket’s Mattermost acceptance criteria and would be the wrong product change.

## What was checked

| Ticket target | Present in `/workspace`? |
| --- | --- |
| `ServiceSettings.SiteURL` | No matches |
| `BuildNumber=dev` seeding of SiteURL | No matches |
| System Console “Please configure your site URL” banner | No matches |
| `./dev-start.sh` | No such file |
| Default `http://localhost:8065` | No Mattermost listen/config path (Grafana uses `:3000`) |

Repo root is Grafana (Go backend, React frontend, `packages/grafana-*`, `public/app/`, `conf/defaults.ini` with `root_url`, etc.).

## Acceptance criteria (from webhook) vs this tree

| Criterion | This tree |
| --- | --- |
| New local boot does not show the Site URL banner | No Mattermost System Console / SiteURL banner path |
| Invite links and emails use `http://localhost:8065` | No Mattermost invite/email SiteURL plumbing |
| Changing SiteURL in Console still requires restart | No Mattermost Console SiteURL config path |
| Document in `./dev-start.sh` / cloud agent notes | No `dev-start.sh`; Grafana docs use `make run` / `yarn start` |

## Recommended next step

Re-home or retarget KAN-15 to the Mattermost (or other) repository that owns `ServiceSettings.SiteURL`, `BuildNumber`, System Console, and `dev-start.sh`. Do not invent Mattermost config seeding under Grafana — it would be dead / wrong-product code in this monorepo.

If the board intent was Grafana local URL instead, open a separate ticket against `[server] root_url` / port 3000 with Grafana-specific acceptance criteria.

## What this PR does not change

No Grafana runtime, config defaults, SQL, Explore, or frontend package behavior. Documentation-only findings note under `contribute/findings/`.
