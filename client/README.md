# Gilgit Rental Platform — Web Client

Production-oriented React client for the Gilgit Rental Platform. The web app covers the public rental discovery experience plus authenticated renter, property-owner, and administrator workspaces.

## Stack

- React 19 + Vite 8
- Tailwind CSS 4
- Redux Toolkit + RTK Query
- React Router
- Motion
- React Hook Form + Zod
- MapLibre / react-map-gl
- Sonner notifications
- Lucide icons
- React Dropzone for listing and evidence uploads
- Vitest for automated tests
- Oxlint for static analysis

## Local setup

1. Copy `.env.example` to `.env`.
2. Set `VITE_API_URL` to the backend API base URL.
3. Set `VITE_GOOGLE_CLIENT_ID` to the Google Identity Services web client ID.
4. Run `npm ci`.
5. Run `npm run dev`.

Default local API URL: `http://localhost:5000/api`.

## Quality commands

```bash
npm run lint
npm run test
npm run build
npm run check
```

`npm run check` runs linting, automated tests, and the production build in sequence. The same checks are defined in `.github/workflows/client-ci.yml` for the development branch and pull requests.

## Implemented product areas

### Public experience

- Responsive landing page and navigation
- Property search, pagination, rich filtering and sorting
- Grid/map discovery experience
- Property details with media, amenities and location map
- Gilgit Living Score
- Smart Matching based on transparent stored preferences
- Public completed-tenancy property reviews

### Authentication

- Email/password registration and login
- Google Identity Services sign-in
- JWT session restoration
- Protected routes and administrator guard
- Session-specific RTK Query cache reset on logout

### Renter workspace

- Favorites
- Rental applications, including group applications
- Viewing requests
- Tenancy overview
- Rent ledger
- Property-linked messaging
- Rental agreement electronic acceptance
- Move-in / move-out condition reports with private evidence
- Maintenance requests
- Reviews
- Notifications
- Safety reports
- Account/verification status

### Owner workspace

- Identity verification submission
- Property create/edit workflow
- Listing image upload, cover selection, reordering and deletion
- Submission to administrator review
- Applications and viewing management
- Tenancy creation and completion
- Rent schedule generation and manual payment recording
- Agreement creation
- Condition reports and evidence
- Maintenance management
- Messaging, notifications, reviews and reports

### Administrator workspace

- Admin dashboard
- Owner identity verification queue and secure document review
- Property moderation queue and detailed listing review
- Report moderation and status tracking

## Security notes

Private CNIC/selfie and condition-report evidence are never exposed as permanent public URLs. The frontend retrieves them through authenticated backend endpoints and uses temporary browser object URLs only for the active preview.

The frontend intentionally does not display fake controls for backend capabilities that do not exist. For example, profile editing is read-only until the backend exposes an account-update endpoint.
