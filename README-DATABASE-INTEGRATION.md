# MySQL + MongoDB integration patch for Threat Intel Platform

This is a **patch pack** for the existing Next.js project, not a full replacement repository. It adds database-backed Route Handlers and pages while keeping the app's existing login page, layout, and CSS untouched.

## Connected features

- **MySQL:** dashboard counts/recent incidents/alerts; IOC list/search and add; incidents list/create; IOC-to-incident correlation.
- **MongoDB:** `threat_feed_records` list, add and aggregate counts by source.
- **Database status:** `/api/health` checks MySQL and MongoDB.
- **Pages:** `/dashboard`, `/iocs`, `/incidents`, and new `/threat-feeds`.

The existing login form is still a demo redirect. This pack does **not** implement real password verification, sessions, or Admin/Analyst authorization. Do not expose the app publicly until authentication and authorization are implemented.

## 1. Copy patch files into the existing project

Unzip this file. Merge the included `app`, `components`, and `lib` folders into your existing `threat-intel-platform` folder. Permit the three same-path page files to be replaced:

- `app/dashboard/page.tsx`
- `app/iocs/page.tsx`
- `app/incidents/page.tsx`

It also adds the API routes, `lib` helpers, `components`, and `app/threat-feeds/page.tsx`. It does not replace your login page, root layout, Tailwind CSS, or `tsconfig.json`.

## 2. Install dependencies

Open PowerShell in your project folder and run:

```powershell
npm install mysql2 mongodb
```

## 3. Configure database access

Copy `.env.example` to `.env.local` in the project root and enter your actual MySQL password / MongoDB URI.

```env
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_actual_mysql_password
MYSQL_DATABASE=threat_intel_db
MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DATABASE=threat_intel_db
```

Use the actual credentials from your installation. For MongoDB Atlas, use the cluster's connection URI. **Never commit `.env.local` to GitHub** or put credentials inside React code.

## 4. Database prerequisites

MySQL should already contain the tables `roles`, `users`, `threat_feeds`, `assets`, `iocs`, `incidents`, `ioc_incident`, `asset_ioc`, and `alerts`, plus the view `analyst_dashboard_v`. To generate alerts automatically when an IOC is linked to an Open/Investigating incident, the `ioc_incident` trigger must already exist.

MongoDB should have database `threat_intel_db` and collection `threat_feed_records`.

## 5. Run and verify

Stop the current dev server with `Ctrl+C`, then run:

```powershell
npm run dev
```

Open these URLs:

- `http://localhost:3000/api/health` — expect both database statuses to be `connected`.
- `http://localhost:3000/dashboard` — live MySQL summary.
- `http://localhost:3000/iocs` — MySQL IOC list/search and add form.
- `http://localhost:3000/incidents` — MySQL incident list/create and IOC linking.
- `http://localhost:3000/threat-feeds` — MongoDB documents and source aggregation.

If `/api/health` returns `disconnected`, confirm the respective database service is running and check `.env.local`. If incidents complain that `analyst_dashboard_v` is missing, check that view in MySQL. If linking an IOC does not create an alert, run `SHOW TRIGGERS;` in MySQL and verify the trigger exists.

## 6. Build and commit

```powershell
npm run build
```

Only if the app builds and you've verified the pages, save the changes:

```powershell
git add app lib components README-DATABASE-INTEGRATION.md .env.example
git commit -m "Integrate MySQL and MongoDB with Next.js"
git push
```

Before staging, verify `.env.local` is ignored by `.gitignore`. Never commit secrets.

## API routes included

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/health` | GET | Ping both databases |
| `/api/dashboard` | GET | MySQL summary, recent incidents and alerts |
| `/api/iocs` | GET | Search/list MySQL IOCs |
| `/api/iocs` | POST | Add a MySQL IOC |
| `/api/incidents` | GET | MySQL incidents and alerts |
| `/api/incidents` | POST | Create an incident with an existing reporter user |
| `/api/correlations` | POST | Link IOC to incident; installed MySQL trigger should create alert |
| `/api/threat-feeds` | GET | MongoDB records and aggregation by source |
| `/api/threat-feeds` | POST | Add a flexible MongoDB threat-feed record |


## Authentication and analyst account access

Authentication is now backed by the MySQL `users` and `roles` tables:

- Registration creates an **Analyst** account in MySQL. Passwords are bcrypt-hashed; plaintext passwords are not stored.
- Sign-in checks the saved password hash and account status, then sets an HttpOnly, SameSite session cookie (8-hour lifetime).
- Protected application pages and API routes require a valid session.
- Only a signed-in **Admin** can access `/admin/analysts` and `/api/admin/analysts`; the endpoint checks the role server-side.
- Public sign-up never allows choosing the Admin role.

Install the new dependencies after pulling the repository:

```powershell
npm install
```

Add `AUTH_SECRET` to your local `.env.local`. Use a unique random secret of at least 32 characters; do not commit it. Restart the development server after editing environment variables.

### Set your own account as Admin

1. Start the app and use **Create Account** to register your own account.
2. In MySQL Workbench, run the following statement after replacing the email with the email you registered:

```sql
UPDATE users
SET role_id = (SELECT role_id FROM roles WHERE role_name = 'Admin' LIMIT 1)
WHERE email = 'your-own-email@example.com';
```

3. Sign out (or clear the site's cookies), sign in again so the new role is in the session, and open `/admin/analysts`.

This Admin page shows analyst accounts only. Analysts cannot access it; the server returns 403 for the protected API. Keep `.env.local` and all passwords/secrets private.
