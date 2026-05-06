# Byepo Feature Flag Platform

An enterprise-ready, multi-tenant feature flag management platform. Built to empower organizations to safely test in production, gradually roll out features, and manage remote configurations across multiple environments.

## 🚀 Key Features

*   **Multi-Tenant Architecture**: Strict data isolation between different organizations.
*   **Environment-Aware Flags**: Manage distinct flag states and rollout percentages across `Dev`, `Staging`, and `Prod` environments independently.
*   **API Key Management**: Generate secure, revocable API keys for server-side and client-side SDK integration.
*   **Comprehensive Audit Logs**: Immutable tracking of all flag modifications and administrative actions for compliance and accountability.
*   **Organization Soft-Deletion**: Secure 24-hour grace period deletion workflow for organizations, including a data export utility for Org Admins.
*   **Interactive API Tester**: Built-in developer portal to test API keys and feature flag evaluations in real-time.
*   **Role-Based Access Control**: Secure segmentation between Super Admins, Organization Admins, and End Users.
*   **Modern Premium UI**: Built with React, featuring a sleek dark-mode aesthetic with glassmorphism and Byepo's signature branding.

## 🏗️ Tech Stack

### Frontend
*   **Framework**: React 18 + Vite
*   **Routing**: React Router DOM
*   **Styling**: Custom CSS Modules with responsive design and modern aesthetics.
*   **State Management**: React Context API

### Backend
*   **Runtime**: Node.js
*   **Framework**: Express.js
*   **Database**: PostgreSQL
*   **ORM**: Prisma
*   **Authentication**: JSON Web Tokens (JWT) & bcrypt

---

## 🛠️ Setup Instructions

### 1. Prerequisites
Ensure you have the following installed:
*   Node.js (v18+)
*   PostgreSQL
*   npm

### 2. Backend Setup
```bash
cd backend
npm install
```

Configure your `.env` file in the `backend/` directory:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/byepodb"
JWT_SECRET="your_super_secret_jwt_key"
SUPER_ADMIN_EMAIL="superadmin@byepo.com"
SUPER_ADMIN_PASSWORD="YourSecurePassword123!"
PORT=4000
```

Run database migrations:
```bash
npx prisma migrate dev --name init
```

Start the backend development server:
```bash
npm run dev
```
*(The backend will run on `http://localhost:4000`)*

### 3. Frontend Setup
Open a new terminal window:
```bash
cd frontend
npm install
```

Start the Vite development server:
```bash
npm run dev
```
*(The frontend will run on `http://localhost:3000`)*

---

## 💻 Portal Access

The application consists of several integrated portals:

| Portal | Route | Description |
|--------|-------|-------------|
| **Home / Login** | `/` | Main landing page and routing hub. |
| **Super Admin** | `/super-admin` | Manage organizations, oversee system health, handle soft-deletions, and force password resets. |
| **Org Admin** | `/admin` | Manage feature flags, API keys, organization members, and view audit logs. |
| **End User** | `/user` | Portal for end-users to check if specific features are enabled for their account. |
| **API Tester** | `/api-tester` | Developer tool to validate SDK API Keys and simulate flag evaluations. |

---

## 🔒 Security & Architecture Decisions

1.  **Strict Data Isolation**: All database queries are strictly scoped using `req.user.orgId` verified from the JWT.
2.  **Graceful Soft-Deletion**: Deleting an organization does not instantly destroy it. It enters a `PENDING_DELETION` state, locking all UI mutations but allowing read-only API access to prevent immediate production outages for integrated SDKs. A background Node.js worker permanently purges the data after 24 hours.
3.  **Audit Integrity**: Audit logs are generated synchronously with database transactions to ensure a 100% accurate history of changes.

---

*Simplifying Complexity | Powering Progress*
