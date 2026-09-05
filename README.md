# Gilgit Rental Platform

A production-oriented MERN stack rental platform designed for Gilgit, Pakistan.

The platform connects renters with verified property owners for hostels, rooms, apartments, and houses and supports the rental lifecycle from property discovery through tenancy management.

## Core Features

- Email/password authentication with JWT
- Google Sign-In backend using Google Identity Services ID tokens
- Role-based authorization (`user` and `admin`)
- Owner identity verification
- Property submission and admin moderation
- Property listings and advanced search
- Smart property matching using transparent weighted rules
- Gilgit Living Score
- Favorites
- Individual and group rental applications
- Property viewing scheduling
- In-app messaging through REST APIs
- Digital rental agreements
- Electronic agreement acceptance by both parties
- Tenancy management
- Rent ledger and manual payment recording
- Move-in and move-out condition reports with evidence
- Maintenance requests and status tracking
- Reviews and ratings
- In-app notifications for rental lifecycle events
- Property/user reporting and admin moderation workflows

## Tech Stack

### Frontend

- React
- Vite

### Backend

- Node.js
- Express.js

### Database

- MongoDB
- Mongoose

### Authentication

- JWT for application sessions
- Google Identity Services ID-token verification for Google Sign-In

### File Storage

- Appwrite Storage

## Backend Architecture

The backend follows a modular Express structure with controllers, routes, middleware, services, and Mongoose models.

Important backend safeguards include:

- verified-owner requirement before creating rental listings
- admin review before a property becomes publicly published
- one accepted rental application per property
- rental-property mutation protection while an active tenancy exists
- secure private evidence access for condition reports
- CORS allowlisting and API rate limiting
- environment validation before application startup
- graceful server shutdown

## Rental Lifecycle

A typical rental flow is:

`property -> application -> viewing -> accepted application -> tenancy -> rent ledger -> agreement -> condition reports -> maintenance/reviews`

Payment gateway integration is not currently part of the project. Rent payments are recorded manually in the rent ledger.

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

## Development

From the `server` directory:

```bash
npm run dev
```

Production startup:

```bash
npm start
```

## Project Status

Backend rental-lifecycle functionality is implemented and under integration/testing with the frontend.

## Academic Project

Final Year Project — Bachelor of Science in Computer Science.