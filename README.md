# 💸 Epay-Backend

A role-based digital wallet system built using Node.js, Express.js, Mongoose, Passport, and Zod. This API supports secure wallet operations like adding money, sending money, agent cash-in/out, and full admin control.

## 🚀 Features

- User & Agent registration and authentication (email/password & Google OAuth)
- Role-based access control (USER, AGENT, ADMIN, SUPER_ADMIN)
- Wallet operations: Add, Withdraw, Send money
- Agent Cash In & Cash Out with commission tracking
- Transaction tracking and reporting
- Admin dashboards for users, wallets, and transactions
- Pagination, filtering, and field selection supported

---

## 🛠️ Setup Instructions

1. Clone the repository:
   ```bash
   git clone https://github.com/emon3455/Epay-Backend.git
   cd Epay-Backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root with the following variables which is present on the <b>.env.example</b>

   ```env
PORT=5000
DB_URL=mongodb+srv://example_db_user_name:example_db_password@cluster0.edawjnd.mongodb.net/example-db?retryWrites=true&w=majority&appName=Cluster0
NODE_ENV=development

# JWT
JWT_ACCESS_SECRET=access_secret
JWT_ACCESS_EXPIRES=1d

# BCRYPT
BCRYPT_SALT_ROUND=10

# SUPER ADMIN
SUPER_ADMIN_EMAIL=super@gmail.com
SUPER_ADMIN_PASSWORD=12345678

# Google
GOOGLE_CLIENT_SECRET=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8w66B
GOOGLE_CLIENT_ID=15454875970933-bndsaibhpgo478hgp986k5c45omchr.apps.googleusercontent.com
GOOGLE_CALLBACK_URL=http://localhost:5000/api/v1/auth/google/callback

# Express Session
EXPRESS_SESSION_SECRET=express-session

# Frontend URL
FRONTEND_URL=http://localhost:5173


   ```

4. Run the server:
   ```bash
   npm run dev
   ```

---

## 📦 API Endpoints

### 🔐 Auth Routes (`/api/v1/auth`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `http://localhost:5000/api/v1/auth/auth/login` | Login with email & password |
| POST | `http://localhost:5000/api/v1/auth/auth/refresh-token` | Refresh access token |
| POST | `http://localhost:5000/api/v1/auth/auth/logout` | Logout user |
| POST | `http://localhost:5000/api/v1/auth/auth/reset-password` | Reset password (admin only) |
| GET | `http://localhost:5000/api/v1/auth/auth/google` | Google OAuth login |
| GET | `http://localhost:5000/api/v1/auth/auth/google/callback` | Google OAuth callback |

---

### 👤 User Routes (`/api/v1/user`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `http://localhost:5000/api/v1/user/user/register` | Register a new user |
| GET | `http://localhost:5000/api/v1/user/user/all-user` | Get all users (admin only) |
| GET | `http://localhost:5000/api/v1/user/user/all-agent` | Get all agents (admin only) |
| PATCH | `http://localhost:5000/api/v1/user/user/:id` | Update user (admin only) |
| PATCH | `http://localhost:5000/api/v1/user/user/agent/approve-reject/:id` | Approve/reject agent (admin only) |

---

### 💰 Wallet Routes (`/api/v1/wallet`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `http://localhost:5000/api/v1/wallet/wallet/me` | Get logged-in user's wallet (USER, AGENT) |
| POST | `http://localhost:5000/api/v1/wallet/wallet/add-money` | Add money to wallet (USER) |
| POST | `http://localhost:5000/api/v1/wallet/wallet/withdraw-money` | Withdraw money from wallet (USER) |
| POST | `http://localhost:5000/api/v1/wallet/wallet/send-money` | Send money to another wallet (USER) |
| POST | `http://localhost:5000/api/v1/wallet/wallet/cash-in` | Agent cash-in to user (AGENT) |
| POST | `http://localhost:5000/api/v1/wallet/wallet/cash-out` | Agent cash-out from user (AGENT) |
| GET | `http://localhost:5000/api/v1/wallet/wallet/admin/all` | Get all wallets (admin only) |
| PATCH | `http://localhost:5000/api/v1/wallet/wallet/admin/block/:id` | Block a wallet (admin only) |

---

### 📊 Transaction Routes (`/api/v1/transaction`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `http://localhost:5000/api/v1/transaction/transaction/me` | Get your transaction history (USER, AGENT) |
| GET | `http://localhost:5000/api/v1/transaction/transaction/admin/all` | Get all transactions (admin only) |
| GET | `http://localhost:5000/api/v1/transaction/transaction/agent/commission/:id` | Get agent commission by ID (AGENT, ADMIN) |

---

## ⚙️ Roles & Access

| Role | Capabilities |
|------|--------------|
| USER | Send, withdraw, and add money |
| AGENT | Perform cash-in/out operations |
| ADMIN | Manage users, wallets, and transactions |
| SUPER_ADMIN | Full system access |

---

## 📅 Last Updated
{today.strftime('%B %d, %Y')}

---

## 🧠 Notes

- All routes are prefixed with `/api/v1/`
- Auth-protected routes use Bearer tokens or Google OAuth session
- Supports full query filtering, pagination, and field selection (e.g., `?page=2&limit=10&searchTerm=name`)

---

## 📩 Feedback / Issues

If you encounter bugs or want to contribute, open a GitHub issue or pull request!
