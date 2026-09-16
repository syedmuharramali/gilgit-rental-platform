# Gilgit Rental Platform

A production-oriented MERN stack rental platform designed for Gilgit, Pakistan.

The platform connects renters with verified property owners for hostels, rooms, apartments, and houses. It is designed for non-technical local users and focuses on one clear journey: finding a place and reaching a signed rental agreement.

## Core Features

- Email/password authentication with JWT
- Google Sign-In using Google Identity Services ID tokens
- Role-based authorization (`user` and `admin`)
- Owner identity verification (CNIC + selfie, reviewed by an admin)
- Property submission and admin moderation
- Property listings with search, filters, and sorting
- Smart property matching using transparent weighted rules
- Gilgit Living Score (heating, hot water, backup power, water, road and winter access)
- Saved properties (favorites)
- Individual and group rental applications
- Property viewing requests
- In-app messaging between renters and owners
- Rental terms proposal, change requests, and acceptance
- Digital rental agreements accepted electronically by both parties
- Reviews and ratings once a rental has started
- In-app notifications for every step of the journey
- Property/user reporting with admin moderation

## Tech Stack

### Frontend

- React 19 + Vite
- Tailwind CSS
- Redux Toolkit / RTK Query

### Backend

- Node.js
- Express.js 5

### Database

- MongoDB (Atlas replica set — agreement steps use transactions)
- Mongoose 9

### Authentication

- JWT for application sessions
- Google Identity Services ID-token verification for Google Sign-In

### File Storage

- Appwrite Storage (public listing images, private identity documents)

## Rental Journey

`register/login -> browse -> property details -> save -> smart matches -> message owner -> request viewing -> apply -> owner accepts -> rental terms agreed -> rental agreement accepted by both -> done`

After both parties accept the agreement, the rental is **upcoming** until its start date and then **active**. Once active, the property is marked as rented and removed from public listings. Upcoming rentals are activated automatically (hourly, and whenever either party opens their rentals or agreements).

Payments, rent ledgers, maintenance requests, condition reports, and move-out workflows are intentionally out of scope.

## Backend Architecture

The backend follows a modular Express structure with controllers, routes, middleware, services, and Mongoose models.

Important backend safeguards include:

- verified-owner requirement before creating rental listings
- admin review before a property becomes publicly published
- one accepted rental application per property
- listings are locked (no edits, image changes, or deletion) once an application is accepted or the property is rented
- private identity documents are only served to admins through authenticated endpoints
- CORS allowlisting and API rate limiting
- environment validation before application startup
- graceful server shutdown

## Google Sign-In Backend

The frontend should obtain a Google Identity Services ID token and send it to:

```text
POST /api/auth/google
```

Request body:

```json
{
  "credential": "<google-id-token>"
}
```

The backend verifies the token signature, algorithm, audience, issuer, expiration, and verified-email claim before creating or linking the user account.

Required environment variable:

```text
GOOGLE_CLIENT_ID=<google-oauth-web-client-id>
```

## Local Development

Requirements: Node.js 20+ and a MongoDB Atlas database (or a local replica set).

Backend:

```bash
cd server
cp .env.example .env   # fill in MongoDB, JWT, Google and Appwrite values
npm ci
npm run seed:amenities # first run only
npm run dev            # http://localhost:5000
```

Frontend:

```bash
cd client
cp .env.example .env
npm ci
npm run dev            # http://localhost:5173
```

Useful checks:

```bash
cd client && npm run check        # lint + tests + build
cd server && npm run diagnose:storage  # Appwrite upload diagnostics
```

Production startup:

```bash
cd server && npm start
```

## Project Status

The core rental journey is implemented end to end. The frontend UI is being redesigned.

## Academic Project

Final Year Project — Bachelor of Science in Computer Science.