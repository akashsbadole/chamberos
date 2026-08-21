# VPS Deployment Guide (Docker)

A full self-hosted stack on a single VPS: the app + Postgres, a reverse
proxy with automatic HTTPS, and open-source tools to actually manage it day
to day — a Docker UI, a database UI, uptime monitoring, and automated
backups. Every tool here is free/open-source; nothing requires a paid SaaS
account.

**What was verified during development** (see the note at the bottom of
each relevant section): the Postgres schema, the app's auth/multi-tenancy,
`docker build`'s Dockerfile parsing, and `docker compose config`'s full YAML
validation. **What could not be verified in the sandbox this was built in**:
actually pulling images and running containers — its egress proxy blocks
both Docker Hub (`registry-1.docker.io`) and Prisma's engine CDN. Your VPS
will have normal internet access and won't hit either of these; this is
called out explicitly wherever it's relevant, not glossed over.

---

## 1. Provision the VPS

Any provider works (DigitalOcean, Hetzner, Linode, AWS Lightsail, etc.).
Minimum spec for this stack: **2 vCPU / 4GB RAM / 40GB disk** — Postgres +
Next.js + 5 small management tools fit comfortably; go to 8GB RAM if you
expect real traffic.

- OS: **Ubuntu 24.04 LTS** (matches what this was built against).
- Point a domain (or subdomain) at the VPS's IP address now — DNS
  propagation takes time, and you'll need it working before step 6.

## 2. Basic server hardening (before anything else)

SSH in as root (or your provisioned user), then:

```bash
# System updates
apt update && apt upgrade -y

# Create a non-root user with sudo, if you don't already have one
adduser deploy
usermod -aG sudo deploy

# Firewall — only allow SSH, HTTP, HTTPS. Nginx Proxy Manager's admin UI
# (port 81) is deliberately NOT opened here — see step 6 for how to reach
# it safely via an SSH tunnel instead of exposing it publicly.
apt install -y ufw
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable

# Fail2ban — blocks IPs after repeated failed SSH login attempts
apt install -y fail2ban
systemctl enable --now fail2ban

# Unattended security upgrades
apt install -y unattended-upgrades
dpkg-reconfigure --priority=low unattended-upgrades
```

Switch to the `deploy` user for everything from here on (`su - deploy`).

## 3. Install Docker

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
newgrp docker   # or log out/in

docker --version
docker compose version
```

## 4. Get the app onto the server

```bash
git clone <your-repo-url> chambers
cd chambers
```

(Or `scp`/`rsync` the project directory if it's not in a git remote yet.)

## 5. Configure secrets

```bash
cp .env.example .env
nano .env   # or your editor of choice
```

Fill in real values — **do not use the placeholder values**:

- `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` — pick a strong
  password (`openssl rand -base64 24`).
- `DATABASE_URL` — build it from the three values above:
  `postgresql://<user>:<password>@db:5432/<db>?schema=public` — note the
  host is `db`, the Docker Compose service name, not `localhost`.
- `AUTH_SECRET` — `openssl rand -base64 32`.
- `AI_ENCRYPTION_KEY` — `openssl rand -base64 32`.

## 6. Start the stack

```bash
docker compose up -d --build
```

This builds the app image, starts Postgres, waits for it to be healthy, then
starts the app — `docker-entrypoint.sh` applies the database schema
automatically on first boot (see the comment in that file for exactly what
it does and why). Also starts Nginx Proxy Manager, Portainer, Adminer,
Uptime Kuma, the backup service, and Watchtower.

Check everything came up:

```bash
docker compose ps
docker compose logs -f app   # watch the app's own startup log
```

### Wire up the reverse proxy + TLS (Nginx Proxy Manager)

1. Visit `http://<your-server-ip>:81` — first-run default login is
   `admin@example.com` / `changeme`. **Change this immediately.**
   (After this first login, consider closing port 81 in `ufw` entirely and
   reaching it only via an SSH tunnel: `ssh -L 8181:localhost:81
   deploy@yourserver`, then browse to `localhost:8181` — this is the
   standard way to admin NPM without exposing it publicly.)
2. **Proxy Hosts → Add Proxy Host**:
   - Domain: `yourdomain.com`
   - Forward hostname/IP: `app` (the Docker Compose service name)
   - Forward port: `3000`
   - Enable **Websockets Support** (Next.js uses it for HMR/dev; harmless
     to leave on in production too).
   - **SSL tab**: Request a new Let's Encrypt certificate, enable Force SSL.
3. Repeat for the management tools, each on its own subdomain — this is
   why they don't publish host ports themselves:
   - `portainer.yourdomain.com` → forward to `portainer`, port `9443`
     (Portainer's HTTPS port) or `8000` depending on the image version —
     check `docker compose logs portainer` for the exact port it's
     listening on if unsure.
   - `db.yourdomain.com` → forward to `adminer`, port `8080`.
   - `status.yourdomain.com` → forward to `uptime-kuma`, port `3001`.
   - Put a certificate + Force SSL on each of these too, and strongly
     consider adding NPM's built-in **Access List** (HTTP basic auth) on
     the Portainer and Adminer hosts specifically — they're direct
     database/Docker control panels and shouldn't be reachable by anyone
     who just guesses the subdomain.

### First run of each tool

- **Portainer** (`portainer.yourdomain.com`): first visit prompts you to
  set an admin password. Connect it to the local Docker environment (it
  auto-detects via the mounted socket).
- **Uptime Kuma** (`status.yourdomain.com`): first visit prompts you to
  create an admin account. Add a monitor for `https://yourdomain.com`
  (HTTP(s) type) and configure a notification channel (Telegram, email,
  webhook, etc. — all free, all built in).
- **Adminer** (`db.yourdomain.com`): log in with System: `PostgreSQL`,
  Server: `db`, Username/Password/Database: whatever you set in `.env`.

## 7. Verify

```bash
curl -I https://yourdomain.com/login   # expect 200
```

Visit `https://yourdomain.com/register` in a browser and create your firm's
first admin account — this exercises the full stack (Nginx Proxy Manager →
app → Postgres) exactly the way a real user would.

## 8. Backups

`db-backup` runs automatically (daily, per `docker-compose.yml`), writing
to `./backups` on the host with 7 daily / 4 weekly / 6 monthly retention.
**Also copy `./backups` off the VPS regularly** — a backup that lives on the
same disk as the database doesn't protect you from disk failure. A simple
cron job with `rclone` (also open source) to push to any S3-compatible
storage is the standard low-effort option:

```bash
# one-time setup
sudo apt install -y rclone
rclone config   # configure your S3-compatible remote

# add to crontab -e
0 3 * * * rclone sync /home/deploy/chambers/backups remote:chambers-backups
```

To restore from a backup:
```bash
docker compose exec -T db psql -U <user> -d <db> < backups/daily/<file>.sql
```

## 9. Updating the app

Deliberately **not** automated via Watchtower (see the comment in
`docker-compose.yml` for why) — you pull and rebuild explicitly:

```bash
cd chambers
git pull
docker compose up -d --build app
```

This rebuilds only the `app` service; Postgres and the management tools
keep running untouched. `docker-entrypoint.sh` re-checks the schema on
every start and only applies migrations that haven't been applied yet, so
this is safe to run repeatedly.

The ancillary tools (Portainer, Adminer, Uptime Kuma, Nginx Proxy Manager)
**do** auto-update via Watchtower on a nightly schedule — low risk, since
none of them hold your application data (Postgres does, and it's excluded).

## 10. Monitoring & logs

- **Uptime Kuma** covers "is it up" — set it up first, it's the fastest win.
- **Container logs**: `docker compose logs -f app` (or any service name).
  For anything beyond ad-hoc `logs -f`, Portainer's web UI has a built-in
  log viewer per container — no extra tool needed for a single-VPS setup.
- **Error tracking (optional, more setup)**: for real exception tracking
  beyond logs, **GlitchTip** (https://glitchtip.com/) is an open-source,
  Sentry-API-compatible option you can self-host in the same style as this
  stack — it needs its own Postgres + Redis + worker containers, so it's
  left out of the default `docker-compose.yml` to keep the base stack
  lean. Add it as a second compose file if/when you want it.

## Known gap this guide does NOT close

Everything above gets the app **running** on a VPS with real TLS, backups,
and monitoring. It does not, by itself, make the app ready for real client
data — rate limiting on `/api/auth/*`, moving secrets to a real secrets
manager instead of a `.env` file, and the DPDP compliance review are still
open. See `PRODUCTION_READINESS.md` for the full list; this guide is the
infrastructure half of that document, not a replacement for it.
