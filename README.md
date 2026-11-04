# Threat Intel Platform

A role-aware threat intelligence and IOC correlation application built with Next.js, MySQL, and MongoDB.

## Features

- Analyst and Admin authentication with signed, HTTP-only session cookies.
- Security dashboard with incident, IOC, asset, and alert summaries.
- Incident creation and investigation.
- Shared IOC lookup and IOC-to-incident correlation.
- Admin-only IOC creation, editing, and deletion.
- Threat-feed document ingestion in MongoDB (Admin-only) and read access for Analysts.
- Asset and alert views.
- Admin account overview and role-aware navigation.
- API-side authorization; hiding controls in the UI is not treated as a security boundary.

## Roles

| Capability | Admin | Analyst |
|---|---:|---:|
| View dashboard and security records | Yes | Yes |
| Create incidents | Yes | Yes |
| View shared IOCs | Yes | Yes |
| Create, edit, delete IOCs | Yes | No |
| Correlate IOC with own incident | Yes | Yes |
| Ingest threat-feed records | Yes | No |
| View threat-feed records | Own records | Shared records |
| Access Admin account overview | Yes | No |

## Requirements

- Node.js compatible with the installed Next.js version.
- MySQL database initialized with `database/threat_intel_db_mysql.sql`.
- MongoDB database for `threat_feed_records`.
- Environment variables configured locally.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and set the database connection values and a random `AUTH_SECRET` with at least 32 characters. Never commit `.env.local`.

3. Initialize the MySQL schema using `database/threat_intel_db_mysql.sql`.

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000), create an Analyst account, and sign in. Provision the first Admin through the documented database/seed process; public registration should not grant Admin privileges.

## Validation

```bash
npx tsc --noEmit
npm run lint
npm run build
```

Build and runtime verification require the local environment variables and reachable MySQL/MongoDB services. Do not paste secrets into issues or chat messages.
