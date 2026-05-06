# infra/

VPS infrastructure source of truth for the 7 Ark portals running on Contabo (`api.arkinstitutebc.com` / `217.217.253.184`, hostname `vmi3278110`).

The portals are bare `bun dist/server/index.mjs` processes managed by systemd, with Caddy reverse-proxying by hostname. No Docker. Mirrors the existing `ark-services` (backend) setup on the same box.

## Layout

```
infra/
├── systemd/                  one unit per portal app
│   ├── ark-portal-main.service        → :3001  portal.arkinstitutebc.com
│   ├── ark-portal-training.service    → :3002  training.arkinstitutebc.com
│   ├── ark-portal-procurement.service → :3003  procurement.arkinstitutebc.com
│   ├── ark-portal-inventory.service   → :3004  inventory.arkinstitutebc.com
│   ├── ark-portal-finance.service     → :3005  finance.arkinstitutebc.com
│   ├── ark-portal-billing.service     → :3006  billing.arkinstitutebc.com
│   └── ark-portal-hr.service          → :3007  hr.arkinstitutebc.com
├── caddy/
│   └── Caddyfile.portals     7 reverse_proxy blocks, appended to /etc/caddy/Caddyfile
└── README.md                 (this file)
```

Each unit:

- runs as `ark:ark` (same as `ark-api.service`)
- `WorkingDirectory=/opt/ark-portals/repo/apps/<name>`
- `ExecStart=/home/ark/.bun/bin/bun dist/server/index.mjs`
- `EnvironmentFile=/opt/ark-portals/repo/apps/<name>/.env.production` — provides `PORT` + `VITE_API_URL` + portal URLs
- `Restart=always`, `RestartSec=5` — auto-recover on crash
- `WantedBy=multi-user.target` — auto-start on boot

## Install / refresh on the VPS

```bash
# from this repo on the VPS
cd /opt/ark-portals/repo
sudo cp infra/systemd/ark-portal-*.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now ark-portal-{main,training,procurement,inventory,finance,billing,hr}
```

## Day-2 ops

```bash
# all-portals status at a glance
ssh ark-api 'systemctl status ark-portal-* --no-pager'

# restart one portal
ssh ark-api 'sudo systemctl restart ark-portal-finance'

# tail one portal's logs
ssh ark-api 'journalctl -u ark-portal-main -f'

# check resource use
ssh ark-api 'systemctl status ark-portal-* | grep -E "Memory|CPU"'
```

## Caddy

`/etc/caddy/Caddyfile` on the VPS has 7 reverse-proxy blocks, one per portal subdomain. The blocks live in `infra/caddy/Caddyfile.portals` and are appended to `/etc/caddy/Caddyfile` during install. The pre-existing `api.arkinstitutebc.com` block (managed by `ark-services`) stays at the top of the file untouched.

Install / refresh on the VPS:

```bash
ssh ark-api '
  # take a backup
  sudo cp /etc/caddy/Caddyfile /etc/caddy/Caddyfile.bak.$(date +%Y%m%d)
  # append the portal blocks (idempotent: only adds if not already present)
  if ! grep -q "portal.arkinstitutebc.com" /etc/caddy/Caddyfile; then
    sudo bash -c "echo >> /etc/caddy/Caddyfile && cat /opt/ark-portals/repo/infra/caddy/Caddyfile.portals >> /etc/caddy/Caddyfile"
  fi
  sudo caddy validate --config /etc/caddy/Caddyfile
  sudo systemctl reload caddy
'
```

TLS issuance is automatic via ACME / Let's Encrypt on first valid request after DNS cutover (Step 7).

## Why no Docker

Decided in the migration plan (`/Users/matt/.claude/plans/starry-toasting-manatee.md`). Single host, single dev, single env, our own code → bare `bun + systemd` is leaner: no daemon, no image registry, no extra network hop, no container overhead. ~$8.30/mo total.
