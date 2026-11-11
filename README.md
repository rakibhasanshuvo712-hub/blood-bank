# LifePulse BBMS — Blood Bank Management System

A production-ready, zero-config, Vercel-deployable **Blood Bank Management System** built with **Next.js (App Router), TypeScript, Tailwind CSS, and Lucide React**.

## Key Features

- **Zero-Config Hybrid Data Layer (LocalStorage + Optional Firebase / Neon.tech Sync)**:
  - Works immediately upon deployment to Vercel with **zero environment variables required**.
  - Pre-seeded with 18 realistic Bangladeshi donors across all 8 blood groups (`A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`), live blood stock units, audit logs, and 8 hospital blood requests.
  - All CRUD edits persist automatically in `localStorage`, with optional remote synchronization via `/api/sync` if `FIREBASE_DATABASE_URL` or Neon.tech (`NEON_SQL_ENDPOINT` + `DATABASE_URL`) is configured.
- **Role-Based Authentication (RBAC)**:
  - Built-in login portal with 1-click demo credentials:
    - **Admin**: `admin@bloodbank.com` / `admin123` (Full CRUD, Delete Donors, Stock Management, Request Processing, Reset Demo Data)
    - **Staff**: `staff@bloodbank.com` / `staff123` (Add/Edit Donors, Log & Process Blood Requests, Smart Donor Matching)
- **Dashboard Overview**:
  - Real-time KPI summary cards, Emergency/Critical Stock Alerts (`< 3 units` highlighted in red), Visual 8-Group Stock Grid with quick `+` / `-` buttons, and Priority Pending Requests.
- **Donor Management Module**:
  - Full CRUD, duplicate Bangladeshi phone number prevention, 90-day medical cooldown eligibility calculation, manual availability override toggle, and instant multi-filter search.
- **Blood Stock Inventory**:
  - Live unit management, batch stock adjustment modal, status badges (`Sufficient`, `Low Stock`, `Critical`), and complete stock movement audit history.
- **Blood Request & Smart Donor Matcher**:
  - Create requests with urgency (`Normal`, `Urgent`, `Emergency`), auto-deduct stock on **Approve & Issue**, prevent over-issuance when stock is insufficient, and use **Find Matching Available Donors** to immediately list eligible donors matching the requested blood group.

## Running Locally

```bash
npm install
npm run dev
```

## Production Build Verification

```bash
npm run build
```

## Optional Cloud Sync (Firebase or Neon.tech)

Copy `.env.example` to `.env.local` (or set in Vercel Environment Variables) if you want optional remote persistence:

- **Firebase Realtime Database**: set `FIREBASE_DATABASE_URL`
- **Neon.tech Serverless PostgreSQL**: set `NEON_SQL_ENDPOINT` and `DATABASE_URL`
